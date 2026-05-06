-- ============================================================
-- Generic Transaction RPC
-- ============================================================
-- Allows the client to execute multiple DML operations atomically.
-- Required for `runAtomicUpdate` to be truly atomic.
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_transaction(operations jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  op jsonb;
  v_table text;
  v_action text;
  v_data jsonb;
  v_id text;
  v_keys text;
  v_sql text;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Process each operation sequentially within the transaction
  FOR op IN SELECT * FROM jsonb_array_elements(operations)
  LOOP
    v_table := op->>'table';
    v_action := op->>'action';
    v_data := op->'data';

    -- Sanitize table name
    IF v_table !~ '^[a-zA-Z0-9_]+$' THEN
      RAISE EXCEPTION 'Invalid table name: %', v_table;
    END IF;

    IF v_action = 'insert' THEN
      v_sql := format(
        'WITH inserted AS (INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) RETURNING *) SELECT to_jsonb(inserted.*) FROM inserted',
        v_table, v_table
      );
      EXECUTE v_sql INTO v_result USING v_data;
      
      IF v_result IS NOT NULL THEN
        v_results := v_results || v_result;
      END IF;

    ELSIF v_action = 'update' THEN
      v_id := op->>'id';
      
      SELECT string_agg(quote_ident(key), ',') INTO v_keys FROM jsonb_object_keys(v_data) AS key;
      
      IF v_keys IS NOT NULL AND v_id IS NOT NULL THEN
        v_sql := format(
          'WITH updated AS (UPDATE %I SET (%s) = (SELECT %s FROM jsonb_populate_record(null::%I, $1)) WHERE id = $2::uuid RETURNING *) SELECT to_jsonb(updated.*) FROM updated',
          v_table, v_keys, v_keys, v_table
        );
        EXECUTE v_sql INTO v_result USING v_data, v_id;
        
        IF v_result IS NOT NULL THEN
          v_results := v_results || v_result;
        END IF;
      END IF;

    ELSE
      RAISE EXCEPTION 'Invalid action: %', v_action;
    END IF;
  END LOOP;
  
  RETURN v_results;
END;
$$;

-- Grant permissions to authenticated users to invoke the function
-- Row Level Security policies will apply because of SECURITY INVOKER
REVOKE ALL ON FUNCTION public.execute_transaction(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_transaction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_transaction(jsonb) TO service_role;
