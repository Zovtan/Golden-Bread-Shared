






















begin;


create or replace function public.create_app_user(
  p_email text, p_password text, p_nama_lengkap text,
  p_no_telp text default ''::text, p_role text default 'Kasir'::text,
  p_jenis_pelanggan text default null::text, p_nama_toko text default null::text,
  p_alamat text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_user_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then
    raise exception 'Tidak diizinkan: hanya Admin yang dapat membuat akun.'
      using errcode = '42501';
  end if;

  perform set_config('app.trusted_user_create', 'on', true);

  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000',
    p_email, crypt(p_password, gen_salt('bf')), now(),
    jsonb_build_object(
      'nama_lengkap', p_nama_lengkap, 'no_telp', p_no_telp, 'role', p_role,
      'jenis_pelanggan', p_jenis_pelanggan, 'nama_toko', p_nama_toko, 'alamat', p_alamat
    ),
    'authenticated', 'authenticated', now(), now(), '', '', '', ''
  );

  insert into public.profiles (
    id, nama_lengkap, no_telp, role, status, jenis_pelanggan, nama_toko, alamat
  ) values (
    v_user_id, p_nama_lengkap, p_no_telp, p_role::public.role_user,
    'Aktif'::public.status_akun, p_jenis_pelanggan::public.jenis_pelanggan,
    p_nama_toko, p_alamat
  )
  on conflict (id) do nothing;

  return v_user_id;
end;
$$;

revoke all   on function public.create_app_user(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_app_user(text, text, text, text, text, text, text, text) to authenticated;

commit;
