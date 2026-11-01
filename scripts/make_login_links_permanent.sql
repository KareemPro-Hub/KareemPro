-- Approved 2026-11-01: existing customer links remain reusable indefinitely.
-- No tokens are created or exposed; deleting a token/client still revokes it.
-- Idempotent data update; the existing NOT NULL timestamptz column is retained.
UPDATE public.login_tokens
SET expires_at = 'infinity'::timestamptz
WHERE expires_at <> 'infinity'::timestamptz;
