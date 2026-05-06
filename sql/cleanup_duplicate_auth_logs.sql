-- ============================================================================
-- Cleanup: Remove duplicate LOGIN audit log entries
-- ============================================================================
-- Context: A bug in AuthContext.tsx caused every token refresh to create a new
-- LOGIN audit entry. This script keeps only the FIRST LOGIN per user per day
-- and deletes the rest. LOGOUT entries are left untouched.
--
-- Run this ONCE after deploying the fix to AuthContext.tsx.
-- ============================================================================

-- Preview: see how many duplicates exist (run this first to verify)
-- SELECT
--   entity_id,
--   DATE(changed_at) AS login_date,
--   COUNT(*) AS total_logins,
--   COUNT(*) - 1 AS duplicates_to_remove
-- FROM audit_log
-- WHERE entity_type = 'auth' AND action = 'LOGIN'
-- GROUP BY entity_id, DATE(changed_at)
-- HAVING COUNT(*) > 1
-- ORDER BY login_date DESC;

-- Delete all duplicate LOGIN entries, keeping only the earliest per user per day
DELETE FROM audit_log
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY entity_id, DATE(changed_at)
        ORDER BY changed_at ASC
      ) AS rn
    FROM audit_log
    WHERE entity_type = 'auth'
      AND action = 'LOGIN'
  ) ranked
  WHERE ranked.rn > 1
);
