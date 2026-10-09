-- Explicit EXECUTE grants for RPCs called by anon / anonymous-authenticated clients.
--
-- PostgREST only exposes functions the caller role can EXECUTE. New functions
-- default to PUBLIC execute, but an explicit grant survives future hardening
-- and documents intent. Without it, enabling Anonymous sign-ins (required by
-- the couple code login, see 015) can still fail with "permission denied for
-- function" on strict projects.
-- Idempotent: re-runnable.

-- Couple code login (called before/after the anonymous session exists).
grant execute on function link_couple_session(text, text) to anon, authenticated;
grant execute on function validate_access_code(text, text) to anon, authenticated;
grant execute on function redeem_access_code(text, text) to anon, authenticated;

-- Public submission guards + analytics (called as anon on /invite/:slug
-- and as authenticated owners/admins on dashboards).
grant execute on function check_public_rate_limit(text, int, int) to anon, authenticated;
grant execute on function invitation_daily_series(int, date, uuid) to anon, authenticated;

-- Admin-only RPCs (is_admin() gate inside; grant keeps PostgREST exposure explicit).
grant execute on function record_payment(uuid, int, text, date, text) to authenticated;
grant execute on function remove_payment(uuid) to authenticated;
