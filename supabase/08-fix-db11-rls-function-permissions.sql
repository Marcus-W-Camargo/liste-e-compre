-- DB11: rls_auto_enable() is an internal SECURITY DEFINER function used by
-- the ensure_rls event trigger. Client-facing roles must not execute it
-- directly. The function, trigger, purpose, and administrative privileges
-- remain unchanged.

revoke all on function public.rls_auto_enable()
from public, anon, authenticated;
