-- Email is personal data. Identifier-to-email resolution now happens only inside
-- the identifier-login Edge Function, which verifies the supplied password and
-- never returns an email address to the caller.
REVOKE EXECUTE ON FUNCTION public.get_user_email(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_email(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_email(TEXT) FROM authenticated;
