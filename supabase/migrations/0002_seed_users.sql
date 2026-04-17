-- 0002_seed_users — two demo accounts for the PayRequest interview build.
-- Password for both: password123.
-- Rerun-safe via WHERE NOT EXISTS — auth.users has no plain UNIQUE on email.
-- The handle_new_user trigger on auth.users populates the matching profiles row.

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
