-- 0002_seed_users — two demo accounts for the PayRequest interview build.
-- Password for both: password123.
-- Rerun-safe: WHERE NOT EXISTS guards every insert. The handle_new_user trigger
-- populates profiles automatically when auth.users rows land. Supabase GoTrue
-- requires a matching auth.identities row for the email provider, so we seed
-- that too — omitting it is why the password-grant endpoint returns HTTP 500.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
       'authenticated', 'authenticated', e,
       crypt('password123', gen_salt('bf')),
       now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false
from (values ('alice@payrequest.test'), ('bob@payrequest.test')) as v(e)
where not exists (select 1 from auth.users u where u.email = v.e);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       now(), now(), now()
from auth.users u
where u.email in ('alice@payrequest.test', 'bob@payrequest.test')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );
