-- ============================================================
-- Server-side scheduled jobs
-- ============================================================
-- Moves automation out of the browser and into Postgres, where it
-- can be invoked by a Supabase Edge Function / pg_cron.
--
-- Apply this before deploying supabase/functions/run-scheduled-jobs.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.scheduled_stock_level(
  physical_quantity integer,
  reserved_quantity integer DEFAULT 0,
  reorder_threshold integer DEFAULT NULL
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN (COALESCE(physical_quantity, 0) - COALESCE(reserved_quantity, 0)) <= 0 THEN 'out_of_stock'
    WHEN (COALESCE(physical_quantity, 0) - COALESCE(reserved_quantity, 0)) <= COALESCE(reorder_threshold, 10) THEN 'low_stock'
    ELSE 'in_stock'
  END
$$;

CREATE OR REPLACE FUNCTION public.run_scheduled_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lock_key bigint := hashtext('public.run_scheduled_jobs')::bigint;
  lock_acquired boolean;
  task_row record;
  quote_row record;
  inventory_row record;
  quote_item jsonb;
  item_id_text text;
  item_quantity integer;
  release_quantity integer;
  org_row record;
  owner_user_id text;
  pr_items jsonb;
  pr_amount numeric;
  pr_count integer;
  pr_urgent boolean;
  pr_number text;
  pr_sequence integer;
  year_text text := to_char(now(), 'YYYY');
  recurring_created integer := 0;
  recurring_closed integer := 0;
  quotes_expired integer := 0;
  quote_reminders integer := 0;
  purchase_requests_created integer := 0;
  task_reminders integer := 0;
BEGIN
  lock_acquired := pg_try_advisory_lock(lock_key);

  IF NOT lock_acquired THEN
    RETURN jsonb_build_object(
      'skipped', true,
      'reason', 'scheduled jobs already running',
      'ran_at', now()
    );
  END IF;

  BEGIN
    -- 1. Recurring tasks.
    FOR task_row IN
      SELECT *
      FROM tasks
      WHERE recurrence_pattern IS NOT NULL
        AND status = 'completed'
        AND completed_at IS NOT NULL
        AND parent_task_id IS NULL
        AND next_occurrence IS NOT NULL
        AND completed_at >= next_occurrence
      FOR UPDATE SKIP LOCKED
    LOOP
      IF task_row.recurrence_end_date IS NOT NULL
         AND task_row.next_occurrence > task_row.recurrence_end_date THEN
        UPDATE tasks
        SET recurrence_pattern = NULL,
            recurrence_interval = NULL,
            recurrence_end_date = NULL,
            next_occurrence = NULL,
            updated_at = now()
        WHERE id = task_row.id;

        recurring_closed := recurring_closed + 1;
      ELSE
        INSERT INTO tasks (
          id,
          title,
          description,
          due_date,
          priority,
          status,
          owner_id,
          assigned_to,
          created_by,
          entity_type,
          entity_id,
          contact_id,
          deal_id,
          lead_id,
          project_id,
          parent_task_id,
          recurrence_pattern,
          recurrence_interval,
          recurrence_end_date,
          next_occurrence,
          organization_id,
          created_at,
          updated_at
        )
        VALUES (
          gen_random_uuid(),
          task_row.title,
          task_row.description,
          task_row.next_occurrence,
          task_row.priority,
          'open',
          task_row.owner_id,
          task_row.assigned_to,
          task_row.created_by,
          task_row.entity_type,
          task_row.entity_id,
          task_row.contact_id,
          task_row.deal_id,
          task_row.lead_id,
          task_row.project_id,
          task_row.id,
          task_row.recurrence_pattern,
          task_row.recurrence_interval,
          task_row.recurrence_end_date,
          public.calculate_next_occurrence(
            task_row.next_occurrence,
            task_row.recurrence_pattern,
            COALESCE(task_row.recurrence_interval, 1)
          ),
          task_row.organization_id,
          now(),
          now()
        );

        UPDATE tasks
        SET next_occurrence = public.calculate_next_occurrence(
              task_row.next_occurrence,
              task_row.recurrence_pattern,
              COALESCE(task_row.recurrence_interval, 1)
            ),
            updated_at = now()
        WHERE id = task_row.id;

        recurring_created := recurring_created + 1;
      END IF;
    END LOOP;

    -- 2. Expire sent quotes and release reserved inventory.
    FOR quote_row IN
      SELECT *
      FROM quotes
      WHERE status = 'sent'
        AND stock_reserved IS TRUE
        AND valid_until IS NOT NULL
        AND valid_until < now()
      FOR UPDATE SKIP LOCKED
    LOOP
      FOR quote_item IN
        SELECT value
        FROM jsonb_array_elements(COALESCE(quote_row.items, '[]'::jsonb))
      LOOP
        item_id_text := COALESCE(quote_item->>'inventory_item_id', quote_item->>'inventoryItemId');
        item_quantity := COALESCE(NULLIF(quote_item->>'quantity', '')::integer, 0);

        IF item_id_text IS NULL
           OR item_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           OR item_quantity <= 0 THEN
          CONTINUE;
        END IF;

        SELECT *
        INTO inventory_row
        FROM inventory
        WHERE id = item_id_text::uuid
        FOR UPDATE;

        IF NOT FOUND THEN
          CONTINUE;
        END IF;

        release_quantity := LEAST(item_quantity, COALESCE(inventory_row.reserved_quantity, 0));

        UPDATE inventory
        SET reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - item_quantity, 0),
            stock_level = public.scheduled_stock_level(
              stock_quantity,
              GREATEST(COALESCE(reserved_quantity, 0) - item_quantity, 0),
              reorder_threshold
            ),
            updated_at = now()
        WHERE id = inventory_row.id;

        IF release_quantity > 0 THEN
          INSERT INTO inventory_transactions (
            id,
            inventory_item_id,
            inventory_item_name,
            type,
            quantity_change,
            quantity_before,
            quantity_after,
            reserved_change,
            reserved_before,
            reserved_after,
            reason,
            reference_type,
            reference_id,
            reference_number,
            user_id,
            user_name,
            organization_id,
            created_at
          )
          VALUES (
            gen_random_uuid(),
            inventory_row.id,
            inventory_row.name,
            'release',
            0,
            inventory_row.stock_quantity,
            inventory_row.stock_quantity,
            -release_quantity,
            COALESCE(inventory_row.reserved_quantity, 0),
            GREATEST(COALESCE(inventory_row.reserved_quantity, 0) - release_quantity, 0),
            'Quote ' || quote_row.quote_number || ' expired - releasing reservation',
            'quote',
            quote_row.id,
            quote_row.quote_number,
            COALESCE(quote_row.user_id::text, 'system'),
            'Scheduled Job',
            quote_row.organization_id,
            now()
          );
        END IF;
      END LOOP;

      UPDATE quotes
      SET stock_reserved = false,
          status = 'expired',
          updated_at = now()
      WHERE id = quote_row.id;

      quotes_expired := quotes_expired + 1;
    END LOOP;

    -- 3. Mark quote follow-up reminders due. Email dispatch is not implemented
    -- elsewhere yet, so this preserves the current "mark as sent" behavior.
    WITH due_quote_reminders AS (
      UPDATE quotes
      SET reminder_sent = true,
          updated_at = now()
      WHERE status = 'sent'
        AND valid_until IS NOT NULL
        AND COALESCE(reminder_sent, false) = false
        AND now() >= created_at + (((EXTRACT(EPOCH FROM (valid_until - created_at)) / 2)::double precision) * interval '1 second')
        AND now() < valid_until
      RETURNING 1
    )
    SELECT count(*) INTO quote_reminders FROM due_quote_reminders;

    -- 4. Create task reminder notifications.
    WITH due_task_reminders AS (
      SELECT *
      FROM tasks
      WHERE remind_at IS NOT NULL
        AND remind_at <= now()
        AND COALESCE(reminder_sent, false) = false
        AND status <> 'completed'
        AND owner_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      FOR UPDATE SKIP LOCKED
    ),
    inserted_notifications AS (
      INSERT INTO notifications (
        id,
        user_id,
        organization_id,
        type,
        title,
        message,
        link,
        is_read,
        created_at
      )
      SELECT
        gen_random_uuid(),
        owner_id::uuid,
        organization_id,
        'task_reminder',
        'Reminder: ' || title,
        CASE
          WHEN due_date < now() THEN 'Task is overdue.'
          WHEN due_date::date = now()::date THEN 'Task is due today.'
          ELSE 'Task is due on ' || to_char(due_date, 'Mon DD, YYYY')
        END,
        '/tasks',
        false,
        now()
      FROM due_task_reminders
      RETURNING 1
    ),
    updated_tasks AS (
      UPDATE tasks
      SET reminder_sent = true,
          updated_at = now()
      WHERE id IN (SELECT id FROM due_task_reminders)
      RETURNING 1
    )
    SELECT count(*) INTO task_reminders FROM updated_tasks;

    -- 5. Create consolidated purchase requests for low/out-of-stock inventory.
    FOR org_row IN
      SELECT DISTINCT organization_id
      FROM inventory
      WHERE status = 'active'
        AND (stock_quantity - COALESCE(reserved_quantity, 0)) <= COALESCE(reorder_threshold, 10)
    LOOP
      SELECT COALESCE(au.auth_user_id::text, i.user_id::text, i.owner_id::text)
      INTO owner_user_id
      FROM inventory i
      LEFT JOIN LATERAL (
        SELECT auth_user_id
        FROM app_users
        WHERE organization_id IS NOT DISTINCT FROM org_row.organization_id
          AND auth_user_id IS NOT NULL
        ORDER BY created_at ASC NULLS LAST
        LIMIT 1
      ) au ON true
      WHERE i.status = 'active'
        AND i.organization_id IS NOT DISTINCT FROM org_row.organization_id
        AND (i.stock_quantity - COALESCE(i.reserved_quantity, 0)) <= COALESCE(i.reorder_threshold, 10)
      ORDER BY i.created_at ASC NULLS LAST
      LIMIT 1;

      IF owner_user_id IS NULL
         OR owner_user_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        CONTINUE;
      END IF;

      WITH low_inventory AS (
        SELECT
          i.*,
          GREATEST(
            COALESCE(i.reorder_quantity, 0),
            GREATEST(50, (COALESCE(i.reorder_threshold, 10) + 20) - (i.stock_quantity - COALESCE(i.reserved_quantity, 0)))
          )::integer AS restock_quantity
        FROM inventory i
        WHERE i.status = 'active'
          AND i.organization_id IS NOT DISTINCT FROM org_row.organization_id
          AND (i.stock_quantity - COALESCE(i.reserved_quantity, 0)) <= COALESCE(i.reorder_threshold, 10)
          AND NOT EXISTS (
            SELECT 1
            FROM purchase_requests pr
            CROSS JOIN LATERAL jsonb_array_elements(COALESCE(pr.items, '[]'::jsonb)) pr_item
            WHERE pr.organization_id IS NOT DISTINCT FROM i.organization_id
              AND pr.status NOT IN ('rejected', 'ordered')
              AND COALESCE(pr_item->>'inventory_item_id', pr_item->>'inventoryItemId') = i.id::text
          )
      )
      SELECT
        jsonb_agg(jsonb_build_object(
          'id', gen_random_uuid()::text,
          'name', name,
          'quantity', restock_quantity,
          'estimated_price', price * 0.7,
          'inventory_item_id', id::text
        )),
        COALESCE(sum(restock_quantity * price * 0.7), 0),
        count(*),
        COALESCE(bool_or((stock_quantity - COALESCE(reserved_quantity, 0)) <= 0), false)
      INTO pr_items, pr_amount, pr_count, pr_urgent
      FROM low_inventory;

      IF pr_count = 0 THEN
        CONTINUE;
      END IF;

      SELECT COALESCE(max(substring(request_number from ('^PR-' || year_text || '-([0-9]{4})$'))::integer), 0) + 1
      INTO pr_sequence
      FROM purchase_requests;

      pr_number := 'PR-' || year_text || '-' || lpad(pr_sequence::text, 4, '0');

      INSERT INTO purchase_requests (
        id,
        request_number,
        requester_id,
        requester_name,
        amount,
        status,
        date,
        department,
        items,
        justification,
        urgent,
        priority,
        owner_id,
        user_id,
        organization_id,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        pr_number,
        owner_user_id,
        'Automation Engine',
        pr_amount,
        'draft',
        now(),
        'Logistics',
        pr_items,
        'Auto-generated: ' || pr_count || ' item(s) below restock threshold.',
        pr_urgent,
        CASE WHEN pr_urgent THEN 'urgent' ELSE 'medium' END,
        owner_user_id::uuid,
        owner_user_id,
        org_row.organization_id,
        now(),
        now()
      );

      purchase_requests_created := purchase_requests_created + 1;
    END LOOP;

    PERFORM pg_advisory_unlock(lock_key);

    RETURN jsonb_build_object(
      'skipped', false,
      'ran_at', now(),
      'recurring_tasks_created', recurring_created,
      'recurring_tasks_closed', recurring_closed,
      'quotes_expired', quotes_expired,
      'quote_reminders_marked', quote_reminders,
      'task_reminders_created', task_reminders,
      'purchase_requests_created', purchase_requests_created
    );
  EXCEPTION
    WHEN OTHERS THEN
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.run_scheduled_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_scheduled_jobs() TO service_role;
