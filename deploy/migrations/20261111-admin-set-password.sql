-- Lets an admin set a new password for any account. Users cannot reset their own.
create or replace function public.admin_set_password(_user_id uuid, _password text)
returns void
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'केवल एडमिन पासवर्ड बदल सकते हैं';
  end if;
  if _password is null or length(_password) < 8 then
    raise exception 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए';
  end if;
  update auth.users
     set encrypted_password = extensions.crypt(_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = _user_id;
  if not found then
    raise exception 'खाता नहीं मिला';
  end if;
end;
$$;
revoke all on function public.admin_set_password(uuid, text) from public, anon;
grant execute on function public.admin_set_password(uuid, text) to authenticated;
