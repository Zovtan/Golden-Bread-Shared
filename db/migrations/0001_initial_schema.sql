





















begin;




create extension if not exists pgcrypto with schema extensions;  
create extension if not exists pg_cron;                          




do $$ begin
  if not exists (select 1 from pg_type where typname = 'status_bahan') then
    create type public.status_bahan as enum ('Aktif', 'Tidak');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_kadaluarsa') then
    create type public.status_kadaluarsa as enum ('Mendekati', 'Tidak', 'Ya');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_stok') then
    create type public.status_stok as enum ('Habis', 'Kadaluarsa', 'Menipis', 'Normal');
  end if;
  if not exists (select 1 from pg_type where typname = 'role_user') then
    create type public.role_user as enum ('Admin', 'Kasir', 'Pelanggan', 'Produksi');
  end if;
  if not exists (select 1 from pg_type where typname = 'aktivitas_log') then
    create type public.aktivitas_log as enum ('CREATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'UPDATE');
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_masalah_bahan') then
    create type public.jenis_masalah_bahan as enum ('Kedaluwarsa', 'Kualitas Buruk', 'Lainnya', 'Rusak', 'Salah Bahan', 'Terkontaminasi');
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_masalah_produk') then
    create type public.jenis_masalah_produk as enum ('Cacat Produksi', 'Kedaluwarsa', 'Lainnya', 'Rusak', 'Salah Produk', 'Terkontaminasi');
  end if;
  if not exists (select 1 from pg_type where typname = 'tipe_notifikasi') then
    create type public.tipe_notifikasi as enum ('Kadaluarsa', 'Pesanan_Baru', 'Stok_Habis', 'Stok_Menipis');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_pembayaran') then
    create type public.status_pembayaran as enum ('Belum', 'Lunas', 'Tempo');
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_bayar') then
    create type public.jenis_bayar as enum ('Gopay', 'Midtrans', 'QRIS', 'Transfer Bank', 'Tunai');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_pesanan') then
    create type public.status_pesanan as enum ('Dibatalkan', 'Diproses', 'Pending', 'Pending_Payment', 'Selesai');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_produk') then
    create type public.status_produk as enum ('Aktif', 'Tidak');
  end if;
  if not exists (select 1 from pg_type where typname = 'status_akun') then
    create type public.status_akun as enum ('Aktif', 'Tidak_Aktif');
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_pelanggan') then
    create type public.jenis_pelanggan as enum ('Prioritas', 'Reguler');
  end if;
end $$;










create table if not exists public.enum_jenis_bahan (
  id serial not null,
  nilai character varying not null,
  constraint enum_jenis_bahan_pkey primary key (id),
  constraint enum_jenis_bahan_nilai_key unique (nilai)
);

create table if not exists public.enum_kategori_produk (
  id serial not null,
  nilai character varying not null,
  constraint enum_kategori_produk_pkey primary key (id),
  constraint enum_kategori_produk_nilai_key unique (nilai)
);

create table if not exists public.enum_satuan (
  id serial not null,
  nilai character varying not null,
  constraint enum_satuan_pkey primary key (id),
  constraint enum_satuan_nilai_key unique (nilai)
);

create table if not exists public.supplier (
  id_supplier serial not null,
  nama_supplier character varying(150) not null,
  alamat character varying null,
  no_telp text null,
  constraint supplier_pkey primary key (id_supplier)
);


create table if not exists public.profiles (
  id uuid not null,
  nama_lengkap character varying(100) not null,
  no_telp character varying(20) not null,
  role public.role_user not null,
  status public.status_akun not null default 'Aktif'::status_akun,
  nama_toko character varying(100) null,
  jenis_pelanggan public.jenis_pelanggan null,
  alamat text null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint chk_pelanggan_jenis check (
    (role <> 'Pelanggan'::role_user) or (jenis_pelanggan is not null)
  )
);
create index if not exists idx_profiles_role on public.profiles using btree (role);
create index if not exists idx_profiles_status on public.profiles using btree (status);
create index if not exists idx_profiles_jenis on public.profiles using btree (jenis_pelanggan)
  where (jenis_pelanggan is not null);


create table if not exists public.bahan_baku (
  id_bahan serial not null,
  merek character varying(100) null,
  stok_minimal numeric(10, 2) not null,
  batas_peringatan_hari integer not null,
  deskripsi text null,
  status public.status_bahan not null default 'Aktif'::status_bahan,
  jenis_bahan integer not null,
  satuan integer not null,
  constraint bahan_baku_pkey primary key (id_bahan),
  constraint bahan_baku_jenis_bahan_id_fkey foreign key (jenis_bahan) references enum_jenis_bahan (id),
  constraint bahan_baku_satuan_id_fkey foreign key (satuan) references enum_satuan (id)
);
create index if not exists idx_bahan_status on public.bahan_baku using btree (status);


create table if not exists public.produk (
  id_produk serial not null,
  nama_produk character varying(150) not null,
  harga_satuan numeric(10, 2) not null,
  stok_minimal integer not null,
  estimasi_kadaluarsa_hari integer not null,
  batas_peringatan_hari integer not null,
  deskripsi text null,
  resep text null,
  gambar character varying(255) null,
  status public.status_produk not null default 'Aktif'::status_produk,
  kategori_produk integer null,
  constraint produk_pkey primary key (id_produk),
  constraint produk_kategori_produk_id_fkey foreign key (kategori_produk) references enum_kategori_produk (id)
);
create index if not exists idx_produk_status on public.produk using btree (status);


create table if not exists public.pembelian_bahan (
  id_pembelian serial not null,
  id_user uuid not null,
  id_supplier integer null,
  tanggal timestamp without time zone not null default now(),
  status_pembayaran public.status_pembayaran not null default 'Belum'::status_pembayaran,
  jatuh_tempo date null,
  no_faktur character varying null,
  constraint pembelian_bahan_pkey primary key (id_pembelian),
  constraint pembelian_bahan_id_supplier_fkey foreign key (id_supplier) references supplier (id_supplier),
  constraint pembelian_bahan_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);
create index if not exists idx_pembelian_supplier on public.pembelian_bahan using btree (id_supplier);
create index if not exists idx_pembelian_tanggal on public.pembelian_bahan using btree (tanggal);

create table if not exists public.detail_pembelian_bahan (
  id_pembelian integer not null,
  id_bahan integer not null,
  merek character varying(100) null,
  jumlah numeric(10, 2) not null,
  harga_satuan numeric(10, 2) not null,
  kadaluarsa date null,
  constraint detail_pembelian_bahan_pkey primary key (id_pembelian, id_bahan),
  constraint detail_pembelian_bahan_id_bahan_fkey foreign key (id_bahan) references bahan_baku (id_bahan) on delete cascade,
  constraint detail_pembelian_bahan_id_pembelian_fkey foreign key (id_pembelian) references pembelian_bahan (id_pembelian) on delete cascade
);


create table if not exists public.batch_bahan_baku (
  id_batch_bb serial not null,
  id_bahan integer not null,
  id_pembelian integer not null,
  stok numeric(10, 2) not null,
  tgl_beli date not null,
  kadaluarsa date null,
  status_kadaluarsa public.status_kadaluarsa not null default 'Tidak'::status_kadaluarsa,
  status_stok public.status_stok not null default 'Normal'::status_stok,
  constraint batch_bahan_baku_pkey primary key (id_batch_bb),
  constraint batch_bahan_baku_id_bahan_fkey foreign key (id_bahan) references bahan_baku (id_bahan) on delete cascade,
  constraint fk_batch_bb_pembelian foreign key (id_pembelian, id_bahan)
    references detail_pembelian_bahan (id_pembelian, id_bahan) on delete cascade
);
create index if not exists idx_batch_bb_bahan on public.batch_bahan_baku using btree (id_bahan);
create index if not exists idx_batch_bb_pembelian on public.batch_bahan_baku using btree (id_pembelian, id_bahan);
create index if not exists idx_batch_bb_status on public.batch_bahan_baku using btree (status_stok);
create index if not exists idx_batch_bb_exp on public.batch_bahan_baku using btree (kadaluarsa);


create table if not exists public.batch_produk (
  id_batch serial not null,
  id_produk integer not null,
  stok integer not null,
  tgl_produksi date not null,
  kadaluarsa date not null,
  status_kadaluarsa public.status_kadaluarsa not null default 'Tidak'::status_kadaluarsa,
  status_stok public.status_stok not null default 'Normal'::status_stok,
  constraint batch_produk_pkey primary key (id_batch),
  constraint batch_produk_id_produk_fkey foreign key (id_produk) references produk (id_produk) on delete cascade
);
create index if not exists idx_batch_produk_produk on public.batch_produk using btree (id_produk);
create index if not exists idx_batch_produk_status on public.batch_produk using btree (status_stok);
create index if not exists idx_batch_produk_exp on public.batch_produk using btree (kadaluarsa);


create table if not exists public.penjualan_langsung (
  id_penjualan serial not null,
  id_user uuid not null,
  tanggal timestamp without time zone not null default now(),
  total numeric(12, 2) null,
  jenis_pembayaran public.jenis_bayar not null,
  constraint penjualan_langsung_pkey primary key (id_penjualan),
  constraint penjualan_langsung_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);
create index if not exists idx_penjualan_tanggal on public.penjualan_langsung using btree (tanggal);

create table if not exists public.detail_penjualan_langsung (
  id_penjualan integer not null,
  id_produk integer not null,
  qty integer not null,
  harga_satuan numeric(10, 2) not null,
  constraint detail_penjualan_langsung_pkey primary key (id_penjualan, id_produk),
  constraint detail_penjualan_langsung_id_penjualan_fkey foreign key (id_penjualan) references penjualan_langsung (id_penjualan) on delete cascade,
  constraint detail_penjualan_langsung_id_produk_fkey foreign key (id_produk) references produk (id_produk) on delete cascade
);


create table if not exists public.pesanan_online (
  id_pesanan serial not null,
  id_pelanggan uuid not null,
  id_user uuid not null,
  tanggal timestamp without time zone not null default now(),
  waktu_antar timestamp without time zone null,
  status public.status_pesanan not null default 'Pending'::status_pesanan,
  jenis_pembayaran public.jenis_bayar not null,
  pesan_pembatalan text null,
  lat double precision null,
  lng double precision null,
  total_harga numeric null,
  catatan text null,
  nama_penerima text not null,
  no_telp_penerima text not null,
  alamat_pengiriman text not null,
  midtrans_order_id text null,
  ongkir numeric null,
  refund_status text null,
  refund_alasan text null,
  snap_token text null,
  constraint pesanan_online_pkey primary key (id_pesanan),
  constraint pesanan_online_id_pelanggan_fkey foreign key (id_pelanggan) references profiles (id) on delete cascade,
  constraint pesanan_online_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);
create index if not exists idx_pesanan_pelanggan on public.pesanan_online using btree (id_pelanggan);
create index if not exists idx_pesanan_user on public.pesanan_online using btree (id_user);
create index if not exists idx_pesanan_status on public.pesanan_online using btree (status);
create index if not exists idx_pesanan_tanggal on public.pesanan_online using btree (tanggal);

create table if not exists public.detail_pesanan_online (
  id_pesanan integer not null,
  id_produk integer not null,
  qty integer not null,
  harga_satuan numeric(10, 2) not null,
  constraint detail_pesanan_online_pkey primary key (id_pesanan, id_produk),
  constraint detail_pesanan_online_id_pesanan_fkey foreign key (id_pesanan) references pesanan_online (id_pesanan) on delete cascade,
  constraint detail_pesanan_online_id_produk_fkey foreign key (id_produk) references produk (id_produk) on delete cascade
);


create table if not exists public.produksi (
  id_produksi serial not null,
  id_user uuid not null,
  waktu timestamp without time zone not null default now(),
  constraint produksi_pkey primary key (id_produksi),
  constraint produksi_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);

create table if not exists public.detail_produksi_input (
  id_produksi integer not null,
  id_batch_bb integer not null,
  jumlah numeric(10, 2) not null,
  constraint detail_produksi_input_pkey primary key (id_produksi, id_batch_bb),
  constraint detail_produksi_input_id_batch_bb_fkey foreign key (id_batch_bb) references batch_bahan_baku (id_batch_bb) on delete cascade,
  constraint detail_produksi_input_id_produksi_fkey foreign key (id_produksi) references produksi (id_produksi) on delete cascade
);

create table if not exists public.detail_produksi_output (
  id_produksi integer not null,
  id_batch integer not null,
  jumlah integer not null,
  constraint detail_produksi_output_pkey primary key (id_produksi, id_batch),
  constraint detail_produksi_output_id_batch_fkey foreign key (id_batch) references batch_produk (id_batch) on delete cascade,
  constraint detail_produksi_output_id_produksi_fkey foreign key (id_produksi) references produksi (id_produksi) on delete cascade
);


create table if not exists public.masalah_bahan_baku (
  id_masalah serial not null,
  id_batch_bb integer not null,
  id_user uuid not null,
  tanggal timestamp without time zone not null default now(),
  jumlah numeric(10, 2) not null,
  keterangan text null,
  stok_dikurangi numeric(10, 2) not null default 0,
  nama_masalah public.jenis_masalah_bahan not null,
  constraint masalah_bahan_baku_pkey primary key (id_masalah),
  constraint masalah_bahan_baku_id_batch_bb_fkey foreign key (id_batch_bb) references batch_bahan_baku (id_batch_bb) on delete cascade,
  constraint masalah_bahan_baku_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);

create table if not exists public.masalah_produk (
  id_masalah serial not null,
  id_batch integer not null,
  id_user uuid not null,
  tanggal timestamp without time zone not null default now(),
  jumlah integer not null,
  keterangan text null,
  stok_dikurangi integer not null default 0,
  nama_masalah public.jenis_masalah_produk not null,
  constraint masalah_produk_pkey primary key (id_masalah),
  constraint masalah_produk_id_batch_fkey foreign key (id_batch) references batch_produk (id_batch) on delete cascade,
  constraint masalah_produk_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);


create table if not exists public.reservasi_stok_pesanan (
  id_pesanan integer not null,
  id_batch integer not null,
  qty integer not null,
  constraint reservasi_stok_pesanan_pkey primary key (id_pesanan, id_batch),
  constraint fk_reservasi_batch foreign key (id_batch) references batch_produk (id_batch) on delete cascade,
  constraint fk_reservasi_pesanan foreign key (id_pesanan) references pesanan_online (id_pesanan) on delete cascade
);


create table if not exists public.notifikasi (
  id_notif serial not null,
  id_user uuid not null,
  id_produk integer null,
  id_pesanan integer null,
  id_bahan integer null,
  tipe public.tipe_notifikasi not null,
  pesan text not null,
  dibaca boolean not null default false,
  waktu timestamp without time zone not null default now(),
  constraint notifikasi_pkey primary key (id_notif),
  constraint notifikasi_id_bahan_fkey foreign key (id_bahan) references bahan_baku (id_bahan) on delete cascade,
  constraint notifikasi_id_pesanan_fkey foreign key (id_pesanan) references pesanan_online (id_pesanan) on delete cascade,
  constraint notifikasi_id_produk_fkey foreign key (id_produk) references produk (id_produk) on delete cascade,
  constraint notifikasi_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);
create index if not exists idx_notif_user on public.notifikasi using btree (id_user);
create index if not exists idx_notif_dibaca on public.notifikasi using btree (dibaca);


create table if not exists public.log_aktivitas (
  id_log serial not null,
  id_user uuid not null,
  role_saat_itu public.role_user not null,
  aktivitas public.aktivitas_log not null,
  modul character varying(100) not null,
  detail text null,
  timestamp timestamp without time zone not null default now(),
  detail_json jsonb null,
  data_sebelum jsonb null,
  data_sesudah jsonb null,
  constraint log_aktivitas_pkey primary key (id_log),
  constraint log_aktivitas_id_user_fkey foreign key (id_user) references profiles (id) on delete cascade
);
create index if not exists idx_log_user on public.log_aktivitas using btree (id_user);
create index if not exists idx_log_timestamp on public.log_aktivitas using btree ("timestamp");
create index if not exists idx_log_timestamp_desc on public.log_aktivitas using btree ("timestamp" desc);
create index if not exists idx_log_modul_aktivitas on public.log_aktivitas using btree (modul, aktivitas);
create index if not exists idx_log_user_timestamp on public.log_aktivitas using btree (id_user, "timestamp" desc);
create index if not exists idx_log_detail_json_gin on public.log_aktivitas using gin (detail_json);
create index if not exists idx_log_sebelum_gin on public.log_aktivitas using gin (data_sebelum);
create index if not exists idx_log_sesudah_gin on public.log_aktivitas using gin (data_sesudah);


create table if not exists public.konfigurasi_pesanan (
  id integer not null,
  min_segera integer not null default 5,
  min_preorder integer not null default 200,
  max_preorder integer not null default 500,
  jam_mulai_segera time without time zone not null default '08:00:00'::time without time zone,
  jam_selesai_segera time without time zone not null default '17:00:00'::time without time zone,
  waktu_antar_preorder text not null default '["07:00","09:00","11:00","13:00"]'::text,
  menerima_pesanan boolean not null default true,
  menit_highlight_segera integer not null default 15,
  jam_mulai_preorder time without time zone not null default '08:00:00'::time without time zone,
  jam_selesai_preorder time without time zone not null default '17:00:00'::time without time zone,
  menerima_segera boolean not null default true,
  menerima_preorder boolean not null default true,
  ongkir_base integer not null default 0,
  ongkir_multiplier_aktif boolean not null default false,
  ongkir_multiplier numeric(4, 2) not null default 1.5,
  constraint konfigurasi_pesanan_pkey primary key (id)
);









CREATE OR REPLACE FUNCTION public.auth_user_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$ SELECT auth.uid() $function$;

CREATE OR REPLACE FUNCTION public.auth_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()),
    'System'
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    select role = 'Admin' from profiles where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    select role in ('Admin', 'Kasir', 'Produksi') from profiles where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.my_role()
 RETURNS role_user
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    select role from profiles where id = auth.uid();
$function$;


CREATE OR REPLACE FUNCTION public.create_app_user(p_email text, p_password text, p_nama_lengkap text, p_no_telp text DEFAULT ''::text, p_role text DEFAULT 'Kasir'::text, p_jenis_pelanggan text DEFAULT NULL::text, p_nama_toko text DEFAULT NULL::text, p_alamat text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$DECLARE
  v_user_id uuid := gen_random_uuid();
BEGIN
  
  
  
  if not public.is_admin() then
    raise exception 'Tidak diizinkan: hanya Admin yang dapat membuat akun.'
      using errcode = '42501';
  end if;

  
  PERFORM set_config('app.trusted_user_create', 'on', true);

  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role, aud,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object(
      'nama_lengkap',    p_nama_lengkap,
      'no_telp',         p_no_telp,
      'role',            p_role,
      'jenis_pelanggan', p_jenis_pelanggan,
      'nama_toko',       p_nama_toko,
      'alamat',          p_alamat
    ),
    'authenticated', 'authenticated',
    now(), now(),
    '', '', '', ''
  );

  INSERT INTO public.profiles (
    id, nama_lengkap, no_telp, role, status,
    jenis_pelanggan, nama_toko, alamat
  ) VALUES (
    v_user_id,
    p_nama_lengkap,
    p_no_telp,
    p_role::public.role_user,
    'Aktif'::public.status_akun,
    p_jenis_pelanggan::public.jenis_pelanggan,
    p_nama_toko,
    p_alamat
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN v_user_id;
END;$function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  
  v_trusted boolean := coalesce(current_setting('app.trusted_user_create', true), '') = 'on';
  v_role    public.role_user;
  v_jenis   public.jenis_pelanggan;
begin
  if v_trusted then
    
    v_role  := coalesce((new.raw_user_meta_data->>'role')::public.role_user, 'Pelanggan');
    v_jenis := case
                 when (new.raw_user_meta_data->>'jenis_pelanggan') in ('Prioritas','Reguler')
                 then (new.raw_user_meta_data->>'jenis_pelanggan')::public.jenis_pelanggan
                 else null
               end;
  else
    
    v_role  := 'Pelanggan'::public.role_user;
    v_jenis := 'Reguler'::public.jenis_pelanggan;
  end if;

  insert into public.profiles (
    id, nama_lengkap, no_telp, role, nama_toko, jenis_pelanggan, alamat
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', 'Nama Belum Diisi'),
    coalesce(new.raw_user_meta_data->>'no_telp', ''),
    v_role,
    nullif(new.raw_user_meta_data->>'nama_toko', ''),
    v_jenis,
    new.raw_user_meta_data->>'alamat'
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_emails()
 RETURNS TABLE(id uuid, email text, last_sign_in timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    id,
    email,
    last_sign_in_at AS last_sign_in
  FROM auth.users;
$function$;

CREATE OR REPLACE FUNCTION public.pelanggan_update_profil(p_nama_lengkap text DEFAULT NULL::text, p_no_telp text DEFAULT NULL::text, p_alamat text DEFAULT NULL::text, p_nama_toko text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  update public.profiles
     set nama_lengkap = coalesce(p_nama_lengkap, nama_lengkap),
         no_telp      = coalesce(p_no_telp,      no_telp),
         alamat       = coalesce(p_alamat,       alamat),
         nama_toko    = coalesce(p_nama_toko,    nama_toko),
         updated_at   = now()
   where id = auth.uid();
end;
$function$;


CREATE OR REPLACE FUNCTION public.get_all_enums()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select
    (
      select jsonb_object_agg(
        pg_type.typname,
        (select jsonb_agg(enumlabel order by enumsortorder)
         from pg_enum where enumtypid = pg_type.oid)
      )
      from pg_type
      where pg_type.typnamespace = 'public'::regnamespace
      and   pg_type.typtype = 'e'
    )
    ||
    jsonb_build_object(
      'bahan_jenis',     (select jsonb_agg(nilai order by nilai) from public.enum_jenis_bahan),
      'satuan',          (select jsonb_agg(nilai order by nilai) from public.enum_satuan),
      'produk_kategori', (select jsonb_agg(nilai order by nilai) from public.enum_kategori_produk)
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_stok_produk(p_id integer)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select coalesce(sum(stok), 0)::int
  from batch_produk
  where id_produk = p_id
    and status_stok not in ('Habis', 'Kadaluarsa');
$function$;


CREATE OR REPLACE FUNCTION public.insert_log_aktivitas(p_id_user uuid, p_role text, p_aktivitas text, p_modul text, p_detail text DEFAULT NULL::text, p_detail_json jsonb DEFAULT NULL::jsonb, p_data_sebelum jsonb DEFAULT NULL::jsonb, p_data_sesudah jsonb DEFAULT NULL::jsonb, p_timestamp timestamp with time zone DEFAULT now())
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if p_id_user is null or p_id_user = '00000000-0000-0000-0000-000000000000'::uuid then
    return;
  end if;

  insert into log_aktivitas (
    id_user, role_saat_itu, aktivitas, modul,
    detail, detail_json, data_sebelum, data_sesudah, timestamp
  ) values (
    p_id_user,
    p_role::public.role_user,
    p_aktivitas::public.aktivitas_log, p_modul,
    p_detail, p_detail_json, p_data_sebelum, p_data_sesudah, p_timestamp
  );
end;
$function$;




CREATE OR REPLACE FUNCTION public.log_write(p_user_id uuid, p_role role_user, p_aktivitas aktivitas_log, p_modul text, p_detail_json jsonb DEFAULT '{}'::jsonb, p_guest_info text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.log_aktivitas
    (id_user, role_saat_itu, aktivitas, modul, detail, detail_json, guest_info, timestamp)
  values (
    p_user_id,
    p_role,
    p_aktivitas,
    p_modul,
    p_detail_json->>'pesan',
    p_detail_json,
    p_guest_info,
    now()
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.rotate_log_aktivitas()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  DELETE FROM log_aktivitas
  WHERE timestamp < NOW() - INTERVAL '90 days';
$function$;


CREATE OR REPLACE FUNCTION public.notify_jatuh_tempo()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_rec       RECORD;
  v_days      INTEGER;
  v_label     TEXT;
  v_fmt_tgl   TEXT;
  v_pesan     TEXT;
  v_user_id   UUID;
BEGIN
  FOR v_rec IN
    SELECT
      pb.id_pembelian,
      pb.id_user,
      pb.jatuh_tempo,
      pb.status_pembayaran
    FROM pembelian_bahan pb
    WHERE pb.status_pembayaran = 'Tempo'
      AND pb.jatuh_tempo IS NOT NULL
      AND pb.jatuh_tempo >= CURRENT_DATE - INTERVAL '1 day'
      AND pb.jatuh_tempo <= CURRENT_DATE + INTERVAL '3 days'
  LOOP
    v_days := (v_rec.jatuh_tempo - CURRENT_DATE)::INTEGER;

    IF v_days <= 0 THEN
      v_label := 'sudah jatuh tempo!';
    ELSE
      v_label := 'jatuh tempo dalam ' || v_days || ' hari';
    END IF;

    v_fmt_tgl := to_char(v_rec.jatuh_tempo, 'DD Mon YYYY');
    v_pesan   := 'Pembayaran #' || v_rec.id_pembelian || ' - Tempo ' || v_label
                 || E'\nJatuh tempo: ' || v_fmt_tgl;

    FOR v_user_id IN
      SELECT id FROM profiles
      WHERE role IN ('Admin')
         OR id = v_rec.id_user
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM notifikasi
        WHERE id_user = v_user_id
          AND pesan LIKE 'Pembayaran #' || v_rec.id_pembelian || '%'
          AND waktu >= NOW() - INTERVAL '20 hours'
      ) THEN
        INSERT INTO notifikasi (id_user, tipe, pesan, dibaca, waktu)
        VALUES (
          v_user_id,
          'Pesanan_Baru',
          v_pesan,
          false,
          NOW()
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$function$;


CREATE OR REPLACE FUNCTION public.refresh_status_batch_bahan_baku()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update batch_bahan_baku
  set    kadaluarsa = kadaluarsa
  where  kadaluarsa is not null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_status_batch_produk()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_batas integer;
begin
  update batch_produk
  set    kadaluarsa = kadaluarsa   
  where  kadaluarsa is not null;
end;
$function$;


CREATE OR REPLACE FUNCTION public.pelanggan_batalkan_pesanan(p_id integer, p_alasan text DEFAULT 'Dibatalkan oleh pelanggan'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner  uuid;
  v_status public.status_pesanan;
  v_bayar  public.jenis_bayar;
  v_produk text;
  v_pesan  text;
begin
  select id_pelanggan, status, jenis_pembayaran
    into v_owner, v_status, v_bayar
    from public.pesanan_online
   where id_pesanan = p_id;

  if not found            then raise exception 'Pesanan tidak ditemukan.'; end if;
  if v_owner <> auth.uid() then raise exception 'Tidak diizinkan membatalkan pesanan ini.'; end if;

  if v_status not in ('Pending'::public.status_pesanan, 'Pending_Payment'::public.status_pesanan) then
    raise exception 'Pesanan tidak dapat dibatalkan pada status ini.';
  end if;

  if v_bayar = 'Midtrans'::public.jenis_bayar and v_status = 'Pending'::public.status_pesanan then
    raise exception 'Pesanan sudah dibayar. Gunakan Ajukan Refund.';
  end if;

  update public.pesanan_online
     set status           = 'Dibatalkan'::public.status_pesanan,
         pesan_pembatalan = coalesce(p_alasan, 'Dibatalkan oleh pelanggan')
   where id_pesanan = p_id;

  select string_agg(nama_produk, ', ') into v_produk
    from (
      select pr.nama_produk
        from public.detail_pesanan_online d
        join public.produk pr on pr.id_produk = d.id_produk
       where d.id_pesanan = p_id
       order by d.id_produk
       limit 2
    ) t;

  v_pesan := 'Pesanan #' || p_id || ' telah dibatalkan';
  if v_produk is not null then v_pesan := v_pesan || chr(10) || v_produk; end if;
  v_pesan := v_pesan || chr(10) || 'Alasan: ' || coalesce(p_alasan, 'Dibatalkan oleh pelanggan');

  insert into public.notifikasi (id_user, tipe, pesan, dibaca, waktu, id_pesanan)
  select r.id, 'Pesanan_Baru'::public.tipe_notifikasi, v_pesan, false, now(), p_id
    from (
      select v_owner as id
      union
      select id from public.profiles
       where role::text in ('Admin', 'Kasir') and status::text = 'Aktif'
    ) r;
end;
$function$;

CREATE OR REPLACE FUNCTION public.pelanggan_set_pembayaran_pesanan(p_id integer, p_snap_token text DEFAULT NULL::text, p_midtrans_order_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner  uuid;
  v_status public.status_pesanan;
begin
  select id_pelanggan, status
    into v_owner, v_status
    from public.pesanan_online
   where id_pesanan = p_id;

  if not found            then raise exception 'Pesanan tidak ditemukan.'; end if;
  if v_owner <> auth.uid() then raise exception 'Tidak diizinkan mengubah pesanan ini.'; end if;
  if v_status <> 'Pending_Payment'::public.status_pesanan then
    raise exception 'Pesanan tidak sedang menunggu pembayaran.';
  end if;

  update public.pesanan_online
     set snap_token        = coalesce(p_snap_token,        snap_token),
         midtrans_order_id = coalesce(p_midtrans_order_id, midtrans_order_id)
   where id_pesanan = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.pelanggan_konfirmasi_pembayaran(p_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner  uuid;
  v_status public.status_pesanan;
begin
  select id_pelanggan, status
    into v_owner, v_status
    from public.pesanan_online
   where id_pesanan = p_id;

  if not found            then raise exception 'Pesanan tidak ditemukan.'; end if;
  if v_owner <> auth.uid() then raise exception 'Tidak diizinkan mengubah pesanan ini.'; end if;

  if v_status = 'Pending_Payment'::public.status_pesanan then
    update public.pesanan_online
       set status = 'Pending'::public.status_pesanan
     where id_pesanan = p_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.pelanggan_ajukan_refund(p_id integer, p_alasan text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner  uuid;
  v_status public.status_pesanan;
  v_bayar  public.jenis_bayar;
  v_refund text;
begin
  select id_pelanggan, status, jenis_pembayaran, refund_status
    into v_owner, v_status, v_bayar, v_refund
    from public.pesanan_online
   where id_pesanan = p_id;

  if not found            then raise exception 'Pesanan tidak ditemukan.'; end if;
  if v_owner <> auth.uid() then raise exception 'Tidak diizinkan mengajukan refund untuk pesanan ini.'; end if;

  if v_bayar <> 'Midtrans'::public.jenis_bayar or v_status <> 'Pending'::public.status_pesanan then
    raise exception 'Refund hanya bisa diajukan untuk pesanan Midtrans yang sudah dibayar.';
  end if;
  if v_refund is not null then
    raise exception 'Permintaan refund untuk pesanan ini sudah pernah diajukan.';
  end if;

  update public.pesanan_online
     set refund_status = 'Diminta',
         refund_alasan = p_alasan
   where id_pesanan = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.pelanggan_notif_belum_dibayar(p_id integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner  uuid;
  v_status public.status_pesanan;
begin
  select id_pelanggan, status
    into v_owner, v_status
    from public.pesanan_online
   where id_pesanan = p_id;

  if not found            then raise exception 'Pesanan tidak ditemukan.'; end if;
  if v_owner <> auth.uid() then raise exception 'Tidak diizinkan.'; end if;
  if v_status <> 'Pending_Payment'::public.status_pesanan then return; end if;

  if exists (
    select 1 from public.notifikasi
     where id_pesanan = p_id
       and id_user    = v_owner
       and tipe       = 'Pesanan_Baru'::public.tipe_notifikasi
       and waktu      > now() - interval '6 hours'
  ) then return; end if;

  insert into public.notifikasi (id_user, tipe, pesan, dibaca, waktu, id_pesanan)
  values (
    v_owner,
    'Pesanan_Baru'::public.tipe_notifikasi,
    'Pesanan #' || p_id || ' menunggu pembayaran.' || chr(10) ||
      'Selesaikan pembayaran agar pesanan diproses.',
    false,
    now(),
    p_id
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.batalkan_pesanan_kedaluwarsa(p_grace_minutes integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_count integer;
begin
  update public.pesanan_online
     set status           = 'Dibatalkan'::public.status_pesanan,
         pesan_pembatalan = 'Pembayaran tidak diselesaikan tepat waktu'
   where status = 'Pending_Payment'::public.status_pesanan
     and tanggal < now() - make_interval(mins => p_grace_minutes);
  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;


CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_harga_satuan_pesanan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_harga numeric;
begin
  select harga_satuan into v_harga
    from public.produk
   where id_produk = new.id_produk;
  if v_harga is null then
    raise exception 'Produk % tidak ditemukan untuk penetapan harga.', new.id_produk;
  end if;
  new.harga_satuan := v_harga;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_ongkir_pesanan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_base   numeric;
  v_aktif  boolean;
  v_km     double precision;
  v_factor integer;
  a        double precision;
  
  o_lat constant double precision := 2.961244;
  o_lng constant double precision := 99.064685;
  r     constant double precision := 6371;  
begin
  select ongkir_base, coalesce(ongkir_multiplier_aktif, false)
    into v_base, v_aktif
    from public.konfigurasi_pesanan
   where id = 1;
  v_base := coalesce(v_base, 0);

  if not v_aktif or new.lat is null or new.lng is null then
    new.ongkir := v_base;
    return new;
  end if;

  a := sin(radians(new.lat - o_lat) / 2) ^ 2
     + cos(radians(o_lat)) * cos(radians(new.lat))
     * sin(radians(new.lng - o_lng) / 2) ^ 2;
  v_km := r * 2 * atan2(sqrt(a), sqrt(1 - a));

  v_factor := case
                when v_km <= 3  then 1
                when v_km <= 6  then 2
                when v_km <= 10 then 3
                else 4
              end;

  new.ongkir := round(v_base * v_factor / 500.0) * 500;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_update_status_batch_bb()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_stok_min  numeric;
  v_hari_batas integer;
  v_kdl_status public.status_kadaluarsa;
  v_stok_status public.status_stok;
  v_sisa_hari  integer;
BEGIN
  SELECT stok_minimal, batas_peringatan_hari
    INTO v_stok_min, v_hari_batas
    FROM bahan_baku
   WHERE id_bahan = NEW.id_bahan;

  IF NEW.kadaluarsa IS NULL THEN
    v_kdl_status := 'Tidak';
  ELSE
    v_sisa_hari := (NEW.kadaluarsa - CURRENT_DATE)::integer;
    IF    v_sisa_hari <= 0                         THEN v_kdl_status := 'Ya';
    ELSIF v_sisa_hari <= COALESCE(v_hari_batas, 7) THEN v_kdl_status := 'Mendekati';
    ELSE                                                v_kdl_status := 'Tidak';
    END IF;
  END IF;

  IF    NEW.stok <= 0                              THEN v_stok_status := 'Habis';
  ELSIF NEW.stok <= COALESCE(v_stok_min, 0)        THEN v_stok_status := 'Menipis';
  ELSE                                                  v_stok_status := 'Normal';
  END IF;

  NEW.status_kadaluarsa := v_kdl_status;
  NEW.status_stok       := v_stok_status;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_update_status_batch_produk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stok_minimal          integer;
  v_batas_peringatan_hari integer;
  v_new_status_stok       public.status_stok;
  v_new_status_kadaluarsa public.status_kadaluarsa;
BEGIN
  SELECT stok_minimal, COALESCE(batas_peringatan_hari, 7)
    INTO v_stok_minimal, v_batas_peringatan_hari
    FROM produk
   WHERE id_produk = NEW.id_produk;

  IF NEW.stok <= 0 THEN
    v_new_status_stok := 'Habis';
  ELSIF NEW.stok <= COALESCE(v_stok_minimal, 0) THEN
    v_new_status_stok := 'Menipis';
  ELSE
    v_new_status_stok := 'Normal';
  END IF;

  IF NEW.kadaluarsa IS NULL THEN
    v_new_status_kadaluarsa := 'Tidak';
  ELSIF NEW.kadaluarsa < CURRENT_DATE THEN
    v_new_status_kadaluarsa := 'Ya';
  ELSIF NEW.kadaluarsa <= CURRENT_DATE + v_batas_peringatan_hari THEN
    v_new_status_kadaluarsa := 'Mendekati';
  ELSE
    v_new_status_kadaluarsa := 'Tidak';
  END IF;

  NEW.status_stok       := v_new_status_stok;
  NEW.status_kadaluarsa := v_new_status_kadaluarsa;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_notif_batch_bb()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_stok_minimal numeric;
  v_merek        text;
  v_satuan       text;
begin
  select coalesce(b.merek, 'Bahan #'||b.id_bahan), b.satuan::text, b.stok_minimal
  into v_merek, v_satuan, v_stok_minimal
  from bahan_baku b where b.id_bahan = new.id_bahan;

  if new.status_stok = 'Habis' and (old.status_stok is null or old.status_stok <> 'Habis') then
    insert into notifikasi (id_user, id_bahan, tipe, pesan, dibaca, waktu)
    select p.id, new.id_bahan,
      'Stok_Habis',
      'Stok Habis - ' || v_merek || E'\nStok ' || v_merek || ' saat ini 0 ' || coalesce(v_satuan,'') ||
        ', di bawah minimal ' || v_stok_minimal || '. Segera lakukan pembelian.',
      false, now()
    from profiles p where p.role in ('Admin','Produksi') and p.status = 'Aktif';

  elsif new.status_stok = 'Menipis' and (old.status_stok is null or old.status_stok not in ('Menipis','Habis')) then
    insert into notifikasi (id_user, id_bahan, tipe, pesan, dibaca, waktu)
    select p.id, new.id_bahan,
      'Stok_Menipis',
      'Stok Menipis - ' || v_merek || E'\nStok ' || v_merek || ' tinggal ' || new.stok ||
        ' ' || coalesce(v_satuan,'') || ', batas minimal ' || v_stok_minimal || '.',
      false, now()
    from profiles p where p.role in ('Admin','Produksi') and p.status = 'Aktif';
  end if;

  if new.status_kadaluarsa in ('Mendekati','Ya') and
     (old.status_kadaluarsa is null or old.status_kadaluarsa = 'Tidak') then
    insert into notifikasi (id_user, id_bahan, tipe, pesan, dibaca, waktu)
    select p.id, new.id_bahan,
      'Kadaluarsa',
      case new.status_kadaluarsa
        when 'Ya'        then 'Kadaluarsa - ' || v_merek || E'\nBatch Kdl.: ' || to_char(new.kadaluarsa,'DD Mon YYYY') || '. Harap segera digunakan atau dibuang.'
        when 'Mendekati' then 'Mendekati Kadaluarsa - ' || v_merek || E'\nBatch kadaluarsa ' || to_char(new.kadaluarsa,'DD Mon YYYY') || '.'
      end,
      false, now()
    from profiles p where p.role in ('Admin','Produksi') and p.status = 'Aktif';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_notif_batch_produk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_stok_minimal int;
  v_nama         text;
begin
  select p.stok_minimal, p.nama_produk into v_stok_minimal, v_nama
  from produk p where p.id_produk = new.id_produk;

  if new.status_stok = 'Habis' and (old.status_stok is null or old.status_stok <> 'Habis') then
    insert into notifikasi (id_user, id_produk, tipe, pesan, dibaca, waktu)
    select p.id, new.id_produk,
      'Stok_Habis',
      'Produk Habis - ' || v_nama || E'\nStok ' || v_nama || ' ' || new.stok ||
        ' pcs (Min: ' || v_stok_minimal || '). Produk tidak dapat dijual.',
      false, now()
    from profiles p where p.role in ('Admin','Kasir') and p.status = 'Aktif';

  elsif new.status_stok = 'Menipis' and (old.status_stok is null or old.status_stok not in ('Menipis','Habis')) then
    insert into notifikasi (id_user, id_produk, tipe, pesan, dibaca, waktu)
    select p.id, new.id_produk,
      'Stok_Menipis',
      'Stok Menipis - ' || v_nama || E'\nStok ' || v_nama || ' tinggal ' || new.stok ||
        ' pcs, batas minimal ' || v_stok_minimal || ' pcs.',
      false, now()
    from profiles p where p.role in ('Admin','Kasir') and p.status = 'Aktif';
  end if;

  if new.status_kadaluarsa in ('Mendekati','Ya') and
     (old.status_kadaluarsa is null or old.status_kadaluarsa = 'Tidak') then
    insert into notifikasi (id_user, id_produk, tipe, pesan, dibaca, waktu)
    select p.id, new.id_produk,
      'Kadaluarsa',
      case new.status_kadaluarsa
        when 'Ya'        then 'Kadaluarsa - ' || v_nama || E'\nBatch #' || new.id_batch || ' sudah kadaluarsa pada ' || to_char(new.kadaluarsa,'DD Mon YYYY') || '.'
        when 'Mendekati' then 'Mendekati Kadaluarsa - ' || v_nama || E'\nBatch #' || new.id_batch || ' kadaluarsa ' || to_char(new.kadaluarsa,'DD Mon YYYY') || '.'
      end,
      false, now()
    from profiles p where p.role in ('Admin','Kasir') and p.status = 'Aktif';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_notif_pesanan_baru()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_nama text;
begin
  select coalesce(nama_toko, nama_lengkap) into v_nama
  from profiles where id = new.id_pelanggan;

  insert into notifikasi (id_user, id_pesanan, tipe, pesan, dibaca, waktu)
  select p.id, new.id_pesanan,
    'Pesanan_Baru',
    'Pesanan Baru - #' || new.id_pesanan || E'\n' || coalesce(v_nama,'Pelanggan') ||
      ' memesan. Status: Pending.',
    false, now()
  from profiles p where p.role in ('Admin','Kasir') and p.status = 'Aktif';

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_notify_jatuh_tempo_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_days    INTEGER;
  v_label   TEXT;
  v_fmt_tgl TEXT;
  v_pesan   TEXT;
  v_user_id UUID;
BEGIN
  IF NEW.jatuh_tempo IS NULL OR NEW.status_pembayaran <> 'Tempo' THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.jatuh_tempo IS NOT DISTINCT FROM NEW.jatuh_tempo) THEN
    RETURN NEW;
  END IF;

  v_days := (NEW.jatuh_tempo - CURRENT_DATE)::INTEGER;

  IF v_days > 3 THEN
    RETURN NEW;
  END IF;

  IF v_days <= 0 THEN
    v_label := 'sudah jatuh tempo!';
  ELSE
    v_label := 'jatuh tempo dalam ' || v_days || ' hari';
  END IF;

  v_fmt_tgl := to_char(NEW.jatuh_tempo, 'DD Mon YYYY');
  v_pesan   := 'Pembayaran #' || NEW.id_pembelian || ' - Tempo ' || v_label
               || E'\nJatuh tempo: ' || v_fmt_tgl;

  FOR v_user_id IN
    SELECT id FROM profiles
    WHERE role = 'Admin'
       OR id = NEW.id_user
  LOOP
    INSERT INTO notifikasi (id_user, tipe, pesan, dibaca, waktu)
    VALUES (v_user_id, 'Pesanan_Baru', v_pesan, false, NOW())
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_bahan_baku()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Admin';
begin
  begin
    v_user_id := auth.uid();
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform insert_log_aktivitas(
      v_user_id,
      v_role, 'CREATE', 'bahan_baku',
      'Bahan baku ditambah',
      jsonb_build_object('id_bahan', new.id_bahan, 'jenis_bahan', new.jenis_bahan),
      null, to_jsonb(new)
    );
  elsif tg_op = 'UPDATE' then
    perform insert_log_aktivitas(
      v_user_id,
      v_role, 'UPDATE', 'bahan_baku',
      'Bahan baku diubah',
      jsonb_build_object('id_bahan', new.id_bahan, 'jenis_bahan', new.jenis_bahan),
      to_jsonb(old), to_jsonb(new)
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_masalah_bahan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Admin';
begin
  begin
    v_user_id := auth.uid();
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then return coalesce(new, old); end if;

  perform insert_log_aktivitas(
    v_user_id, v_role,
    case tg_op when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end,
    'masalah_bahan_baku',
    'Masalah bahan dicatat',
    jsonb_build_object('id_masalah', coalesce(new.id_masalah, old.id_masalah)),
    case when tg_op != 'INSERT' then to_jsonb(old) end,
    case when tg_op != 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_masalah_produk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Admin';
begin
  begin
    v_user_id := auth.uid();
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then return coalesce(new, old); end if;

  perform insert_log_aktivitas(
    v_user_id, v_role,
    case tg_op when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end,
    'masalah_produk',
    'Masalah produk dicatat',
    jsonb_build_object('id_masalah', coalesce(new.id_masalah, old.id_masalah)),
    case when tg_op != 'INSERT' then to_jsonb(old) end,
    case when tg_op != 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_pembelian_bahan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Admin';
begin
  begin
    v_user_id := coalesce(new.id_user, old.id_user);
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then return new; end if;

  if tg_op = 'INSERT' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'CREATE', 'pembelian_bahan',
      'Pembelian ditambah',
      jsonb_build_object('no_pembelian', new.id_pembelian),
      null, to_jsonb(new)
    );
  elsif tg_op = 'UPDATE' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'UPDATE', 'pembelian_bahan',
      'Pembelian diubah',
      jsonb_build_object('no_pembelian', new.id_pembelian),
      to_jsonb(old), to_jsonb(new)
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_penjualan_langsung()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Kasir';
begin
  begin
    v_user_id := coalesce(new.id_user, old.id_user);
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform insert_log_aktivitas(
      v_user_id,
      v_role, 'CREATE', 'penjualan_langsung',
      'Penjualan ditambah',
      jsonb_build_object('no_pesanan', new.id_penjualan),
      null, to_jsonb(new)
    );
  elsif tg_op = 'UPDATE' then
    perform insert_log_aktivitas(
      v_user_id,
      v_role, 'UPDATE', 'penjualan_langsung',
      'Penjualan diubah',
      jsonb_build_object('no_pesanan', new.id_penjualan),
      to_jsonb(old), to_jsonb(new)
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_pesanan_online()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Pelanggan';
begin
  if tg_op = 'INSERT' then
    begin
      v_user_id := new.id_pelanggan;
      if v_user_id is not null then
        select role::text into v_role from profiles where id = v_user_id;
      end if;
    exception when others then null;
    end;
  else
    begin
      v_user_id := auth.uid();
      if v_user_id is not null then
        select role::text into v_role from profiles where id = v_user_id;
      else
        v_user_id := coalesce(new.id_pelanggan, old.id_pelanggan);
        if v_user_id is not null then
          select role::text into v_role from profiles where id = v_user_id;
        end if;
      end if;
    exception when others then null;
    end;
  end if;

  if v_user_id is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'CREATE', 'pesanan_online',
      'Pesanan dibuat',
      jsonb_build_object('no_pesanan', new.id_pesanan),
      null, to_jsonb(new)
    );
  elsif tg_op = 'UPDATE' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'UPDATE', 'pesanan_online',
      'Pesanan diubah',
      jsonb_build_object('no_pesanan', new.id_pesanan),
      to_jsonb(old), to_jsonb(new)
    );
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_produk()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Admin';
begin
  begin
    v_user_id := auth.uid();
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then return coalesce(new, old); end if;

  if tg_op = 'INSERT' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'CREATE', 'produk',
      'Produk ditambah',
      jsonb_build_object('id_produk', new.id_produk, 'nama_produk', new.nama_produk),
      null, to_jsonb(new)
    );
  elsif tg_op = 'UPDATE' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'UPDATE', 'produk',
      'Produk diubah',
      jsonb_build_object('id_produk', new.id_produk, 'nama_produk', new.nama_produk),
      to_jsonb(old), to_jsonb(new)
    );
  elsif tg_op = 'DELETE' then
    perform insert_log_aktivitas(
      v_user_id, v_role, 'DELETE', 'produk',
      'Produk dihapus',
      jsonb_build_object('id_produk', old.id_produk, 'nama_produk', old.nama_produk),
      to_jsonb(old), null
    );
  end if;
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_produksi()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_user_id uuid;
  v_role    text := 'Produksi';
begin
  begin
    v_user_id := coalesce(new.id_user, old.id_user);
    if v_user_id is not null then
      select role::text into v_role from profiles where id = v_user_id;
    end if;
  exception when others then null;
  end;

  if v_user_id is null then return coalesce(new, old); end if;

  perform insert_log_aktivitas(
    v_user_id, v_role,
    case tg_op when 'INSERT' then 'CREATE' when 'UPDATE' then 'UPDATE' else 'DELETE' end,
    'produksi',
    'Produksi ' || lower(tg_op),
    jsonb_build_object('id_produksi', coalesce(new.id_produksi, old.id_produksi)),
    case when tg_op != 'INSERT' then to_jsonb(old) end,
    case when tg_op != 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.trg_log_profiles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text := COALESCE(NEW.role::text, OLD.role::text, 'Admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM insert_log_aktivitas(
      NEW.id, v_role, 'CREATE', 'profiles',
      'Profil dibuat',
      jsonb_build_object('nama_lengkap', NEW.nama_lengkap, 'role', NEW.role),
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM insert_log_aktivitas(
      NEW.id, v_role, 'UPDATE', 'profiles',
      'Profil diubah',
      jsonb_build_object('nama_lengkap', NEW.nama_lengkap, 'role', NEW.role),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.rotate_empty_batches()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO public, pg_temp
AS $function$
begin
  delete from public.batch_bahan_baku where stok <= 0;
  delete from public.batch_produk     where stok <= 0;
end;
$function$;









drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


drop trigger if exists trg_log_bahan_baku on public.bahan_baku;
create trigger trg_log_bahan_baku
  after insert or update on public.bahan_baku
  for each row execute function public.trg_log_bahan_baku();


drop trigger if exists trg_auto_status_batch_bb on public.batch_bahan_baku;
create trigger trg_auto_status_batch_bb
  before insert or update of stok, kadaluarsa on public.batch_bahan_baku
  for each row execute function public.trg_update_status_batch_bb();

drop trigger if exists trg_notif_batch_bb on public.batch_bahan_baku;
create trigger trg_notif_batch_bb
  after insert or update of status_stok, status_kadaluarsa on public.batch_bahan_baku
  for each row execute function public.trg_notif_batch_bb();


drop trigger if exists trg_auto_status_batch_produk on public.batch_produk;
create trigger trg_auto_status_batch_produk
  before insert or update of stok, kadaluarsa on public.batch_produk
  for each row execute function public.trg_update_status_batch_produk();

drop trigger if exists trg_notif_batch_produk on public.batch_produk;
create trigger trg_notif_batch_produk
  after insert or update of status_stok, status_kadaluarsa on public.batch_produk
  for each row execute function public.trg_notif_batch_produk();


drop trigger if exists trg_set_harga_satuan_pesanan on public.detail_pesanan_online;
create trigger trg_set_harga_satuan_pesanan
  before insert on public.detail_pesanan_online
  for each row execute function public.set_harga_satuan_pesanan();


drop trigger if exists trg_log_masalah_bahan on public.masalah_bahan_baku;
create trigger trg_log_masalah_bahan
  after insert on public.masalah_bahan_baku
  for each row execute function public.trg_log_masalah_bahan();


drop trigger if exists trg_log_masalah_produk on public.masalah_produk;
create trigger trg_log_masalah_produk
  after insert on public.masalah_produk
  for each row execute function public.trg_log_masalah_produk();


drop trigger if exists trg_log_pembelian_bahan on public.pembelian_bahan;
create trigger trg_log_pembelian_bahan
  after insert or update on public.pembelian_bahan
  for each row execute function public.trg_log_pembelian_bahan();

drop trigger if exists trg_notify_jatuh_tempo on public.pembelian_bahan;
create trigger trg_notify_jatuh_tempo
  after insert or update of jatuh_tempo, status_pembayaran on public.pembelian_bahan
  for each row execute function public.trg_notify_jatuh_tempo_fn();


drop trigger if exists trg_log_penjualan_langsung on public.penjualan_langsung;
create trigger trg_log_penjualan_langsung
  after insert or update on public.penjualan_langsung
  for each row execute function public.trg_log_penjualan_langsung();


drop trigger if exists trg_log_pesanan_online on public.pesanan_online;
create trigger trg_log_pesanan_online
  after insert or update on public.pesanan_online
  for each row execute function public.trg_log_pesanan_online();

drop trigger if exists trg_notif_pesanan_baru on public.pesanan_online;
create trigger trg_notif_pesanan_baru
  after insert on public.pesanan_online
  for each row execute function public.trg_notif_pesanan_baru();

drop trigger if exists trg_set_ongkir_pesanan on public.pesanan_online;
create trigger trg_set_ongkir_pesanan
  before insert on public.pesanan_online
  for each row execute function public.set_ongkir_pesanan();


drop trigger if exists trg_log_produk on public.produk;
create trigger trg_log_produk
  after insert or delete or update on public.produk
  for each row execute function public.trg_log_produk();


drop trigger if exists trg_log_produksi on public.produksi;
create trigger trg_log_produksi
  after insert on public.produksi
  for each row execute function public.trg_log_produksi();


drop trigger if exists trg_log_profiles on public.profiles;
create trigger trg_log_profiles
  after insert or update on public.profiles
  for each row execute function public.trg_log_profiles();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();







alter table public.bahan_baku                enable row level security;
alter table public.batch_bahan_baku          enable row level security;
alter table public.batch_produk              enable row level security;
alter table public.detail_pembelian_bahan    enable row level security;
alter table public.detail_penjualan_langsung enable row level security;
alter table public.detail_pesanan_online     enable row level security;
alter table public.detail_produksi_input     enable row level security;
alter table public.detail_produksi_output    enable row level security;
alter table public.enum_jenis_bahan          enable row level security;
alter table public.enum_kategori_produk      enable row level security;
alter table public.enum_satuan               enable row level security;
alter table public.konfigurasi_pesanan       enable row level security;
alter table public.log_aktivitas             enable row level security;
alter table public.masalah_bahan_baku        enable row level security;
alter table public.masalah_produk            enable row level security;
alter table public.notifikasi                enable row level security;
alter table public.pembelian_bahan           enable row level security;
alter table public.penjualan_langsung        enable row level security;
alter table public.pesanan_online            enable row level security;
alter table public.produk                    enable row level security;
alter table public.produksi                  enable row level security;
alter table public.profiles                  enable row level security;
alter table public.reservasi_stok_pesanan    enable row level security;
alter table public.supplier                  enable row level security;


drop policy if exists bahan_baku_all_staff on public.bahan_baku;
create policy bahan_baku_all_staff on public.bahan_baku
  for all to public using (is_staff());


drop policy if exists batch_bahan_baku_all_staff on public.batch_bahan_baku;
create policy batch_bahan_baku_all_staff on public.batch_bahan_baku
  for all to public using (is_staff());


drop policy if exists batch_produk_select_auth on public.batch_produk;
create policy batch_produk_select_auth on public.batch_produk
  for select to authenticated using (true);
drop policy if exists batch_produk_all_staff on public.batch_produk;
create policy batch_produk_all_staff on public.batch_produk
  for all to public using (is_staff());


drop policy if exists detail_pembelian_bahan_all_produksi_admin on public.detail_pembelian_bahan;
create policy detail_pembelian_bahan_all_produksi_admin on public.detail_pembelian_bahan
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));


drop policy if exists detail_penjualan_langsung_all_kasir_admin on public.detail_penjualan_langsung;
create policy detail_penjualan_langsung_all_kasir_admin on public.detail_penjualan_langsung
  for all to public using (my_role() = any (array['Kasir'::role_user, 'Admin'::role_user]));


drop policy if exists detail_pesanan_online_select_pelanggan on public.detail_pesanan_online;
create policy detail_pesanan_online_select_pelanggan on public.detail_pesanan_online
  for select to public using (
    exists (
      select 1 from pesanan_online p
       where p.id_pesanan = detail_pesanan_online.id_pesanan and p.id_pelanggan = auth.uid()
    )
  );
drop policy if exists detail_pesanan_online_insert_pelanggan on public.detail_pesanan_online;
create policy detail_pesanan_online_insert_pelanggan on public.detail_pesanan_online
  for insert to authenticated with check (
    exists (
      select 1 from pesanan_online p
       where p.id_pesanan = detail_pesanan_online.id_pesanan and p.id_pelanggan = auth.uid()
    )
  );
drop policy if exists detail_pesanan_online_all_staff on public.detail_pesanan_online;
create policy detail_pesanan_online_all_staff on public.detail_pesanan_online
  for all to public using (is_staff());


drop policy if exists detail_produksi_input_all_produksi_admin on public.detail_produksi_input;
create policy detail_produksi_input_all_produksi_admin on public.detail_produksi_input
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));


drop policy if exists detail_produksi_output_all_produksi_admin on public.detail_produksi_output;
create policy detail_produksi_output_all_produksi_admin on public.detail_produksi_output
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));


drop policy if exists enum_jenis_bahan_all_staff on public.enum_jenis_bahan;
create policy enum_jenis_bahan_all_staff on public.enum_jenis_bahan
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists enum_jenis_bahan_select_auth on public.enum_jenis_bahan;
create policy enum_jenis_bahan_select_auth on public.enum_jenis_bahan
  for select to authenticated using (true);


drop policy if exists enum_kategori_produk_select_auth on public.enum_kategori_produk;
create policy enum_kategori_produk_select_auth on public.enum_kategori_produk
  for select to authenticated using (true);
drop policy if exists enum_kategori_produk_all_staff on public.enum_kategori_produk;
create policy enum_kategori_produk_all_staff on public.enum_kategori_produk
  for all to authenticated using (is_staff()) with check (is_staff());


drop policy if exists enum_satuan_all_staff on public.enum_satuan;
create policy enum_satuan_all_staff on public.enum_satuan
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists enum_satuan_select_auth on public.enum_satuan;
create policy enum_satuan_select_auth on public.enum_satuan
  for select to authenticated using (true);


drop policy if exists konfigurasi_pesanan_select_auth on public.konfigurasi_pesanan;
create policy konfigurasi_pesanan_select_auth on public.konfigurasi_pesanan
  for select to authenticated using (true);
drop policy if exists konfigurasi_pesanan_update_admin on public.konfigurasi_pesanan;
create policy konfigurasi_pesanan_update_admin on public.konfigurasi_pesanan
  for update to authenticated using (is_admin()) with check (is_admin());


drop policy if exists log_aktivitas_insert_self on public.log_aktivitas;
create policy log_aktivitas_insert_self on public.log_aktivitas
  for insert to public with check (id_user = auth.uid());
drop policy if exists log_aktivitas_select_self on public.log_aktivitas;
create policy log_aktivitas_select_self on public.log_aktivitas
  for select to public using (id_user = auth.uid());
drop policy if exists log_aktivitas_select_admin on public.log_aktivitas;
create policy log_aktivitas_select_admin on public.log_aktivitas
  for select to public using (is_admin());


drop policy if exists masalah_bahan_baku_select_self_admin on public.masalah_bahan_baku;
create policy masalah_bahan_baku_select_self_admin on public.masalah_bahan_baku
  for select to public using ((id_user = auth.uid()) or is_admin());
drop policy if exists masalah_bahan_baku_insert_staff on public.masalah_bahan_baku;
create policy masalah_bahan_baku_insert_staff on public.masalah_bahan_baku
  for insert to public with check (is_staff() and (id_user = auth.uid()));


drop policy if exists masalah_produk_select_self_admin on public.masalah_produk;
create policy masalah_produk_select_self_admin on public.masalah_produk
  for select to public using ((id_user = auth.uid()) or is_admin());
drop policy if exists masalah_produk_insert_staff on public.masalah_produk;
create policy masalah_produk_insert_staff on public.masalah_produk
  for insert to public with check (is_staff() and (id_user = auth.uid()));


drop policy if exists notifikasi_select_self on public.notifikasi;
create policy notifikasi_select_self on public.notifikasi
  for select to public using (id_user = auth.uid());
drop policy if exists notifikasi_insert_staff_self on public.notifikasi;
create policy notifikasi_insert_staff_self on public.notifikasi
  for insert to authenticated with check (is_staff() or (id_user = auth.uid()));
drop policy if exists notifikasi_update_self on public.notifikasi;
create policy notifikasi_update_self on public.notifikasi
  for update to public using (id_user = auth.uid()) with check (id_user = auth.uid());


drop policy if exists pembelian_bahan_all_produksi_admin on public.pembelian_bahan;
create policy pembelian_bahan_all_produksi_admin on public.pembelian_bahan
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));


drop policy if exists penjualan_langsung_all_kasir_admin on public.penjualan_langsung;
create policy penjualan_langsung_all_kasir_admin on public.penjualan_langsung
  for all to public using (my_role() = any (array['Kasir'::role_user, 'Admin'::role_user]));


drop policy if exists pesanan_online_all_staff on public.pesanan_online;
create policy pesanan_online_all_staff on public.pesanan_online
  for all to public using (is_staff());
drop policy if exists pesanan_online_update_pelanggan_bayar on public.pesanan_online;
create policy pesanan_online_update_pelanggan_bayar on public.pesanan_online
  for update to authenticated
  using ((id_pelanggan = auth.uid()) and (status = 'Pending_Payment'::status_pesanan))
  with check ((id_pelanggan = auth.uid()) and (status = any (array['Pending_Payment'::status_pesanan, 'Pending'::status_pesanan])));
drop policy if exists pesanan_online_update_pelanggan_refund on public.pesanan_online;
create policy pesanan_online_update_pelanggan_refund on public.pesanan_online
  for update to authenticated
  using ((id_pelanggan = auth.uid()) and (status = 'Pending'::status_pesanan))
  with check ((id_pelanggan = auth.uid()) and (status = 'Pending'::status_pesanan));
drop policy if exists pesanan_online_delete_pelanggan on public.pesanan_online;
create policy pesanan_online_delete_pelanggan on public.pesanan_online
  for delete to authenticated
  using (
    (id_pelanggan = auth.uid())
    and (status = any (array['Pending'::status_pesanan, 'Pending_Payment'::status_pesanan]))
    and (not exists (select 1 from detail_pesanan_online d where d.id_pesanan = pesanan_online.id_pesanan))
  );
drop policy if exists pesanan_online_select_pelanggan on public.pesanan_online;
create policy pesanan_online_select_pelanggan on public.pesanan_online
  for select to public using (id_pelanggan = auth.uid());
drop policy if exists pesanan_online_insert_pelanggan on public.pesanan_online;
create policy pesanan_online_insert_pelanggan on public.pesanan_online
  for insert to authenticated with check (
    (id_pelanggan = auth.uid())
    and (id_user = auth.uid())
    and (status = any (array['Pending'::status_pesanan, 'Pending_Payment'::status_pesanan]))
    and (coalesce(ongkir, (0)::numeric) >= (0)::numeric)
  );


drop policy if exists produk_select_auth on public.produk;
create policy produk_select_auth on public.produk
  for select to public using (auth.uid() is not null);
drop policy if exists produk_all_staff on public.produk;
create policy produk_all_staff on public.produk
  for all to public using (is_staff());


drop policy if exists produksi_all_produksi_admin on public.produksi;
create policy produksi_all_produksi_admin on public.produksi
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));


drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to public using (id = auth.uid());
drop policy if exists profiles_all_admin on public.profiles;
create policy profiles_all_admin on public.profiles
  for all to public using (is_admin());
drop policy if exists profiles_select_kasir_admin on public.profiles;
create policy profiles_select_kasir_admin on public.profiles
  for select to public using (my_role() = any (array['Kasir'::role_user, 'Admin'::role_user]));


drop policy if exists reservasi_stok_pesanan_select_auth on public.reservasi_stok_pesanan;
create policy reservasi_stok_pesanan_select_auth on public.reservasi_stok_pesanan
  for select to authenticated using (true);
drop policy if exists reservasi_stok_pesanan_all_kasir_admin on public.reservasi_stok_pesanan;
create policy reservasi_stok_pesanan_all_kasir_admin on public.reservasi_stok_pesanan
  for all to authenticated
  using (my_role() = any (array['Kasir'::role_user, 'Admin'::role_user]))
  with check (my_role() = any (array['Kasir'::role_user, 'Admin'::role_user]));


drop policy if exists supplier_all_produksi_admin on public.supplier;
create policy supplier_all_produksi_admin on public.supplier
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));
drop policy if exists supplier_select_auth on public.supplier;
create policy supplier_select_auth on public.supplier
  for select to public using (auth.uid() is not null);







revoke all on function public.pelanggan_batalkan_pesanan(integer, text)               from public, anon;
revoke all on function public.pelanggan_set_pembayaran_pesanan(integer, text, text)    from public, anon;
revoke all on function public.pelanggan_konfirmasi_pembayaran(integer)                 from public, anon;
revoke all on function public.pelanggan_ajukan_refund(integer, text)                   from public, anon;
revoke all on function public.pelanggan_notif_belum_dibayar(integer)                   from public, anon;
revoke all on function public.pelanggan_update_profil(text, text, text, text)          from public, anon;
revoke all on function public.batalkan_pesanan_kedaluwarsa(integer)                    from public, anon, authenticated;


revoke all on function public.create_app_user(text, text, text, text, text, text, text, text) from public, anon;

grant execute on function public.pelanggan_batalkan_pesanan(integer, text)             to authenticated;
grant execute on function public.pelanggan_set_pembayaran_pesanan(integer, text, text) to authenticated;
grant execute on function public.pelanggan_konfirmasi_pembayaran(integer)              to authenticated;
grant execute on function public.pelanggan_ajukan_refund(integer, text)                to authenticated;
grant execute on function public.pelanggan_notif_belum_dibayar(integer)                to authenticated;
grant execute on function public.pelanggan_update_profil(text, text, text, text)       to authenticated;


grant execute on function public.create_app_user(text, text, text, text, text, text, text, text) to authenticated;




insert into public.konfigurasi_pesanan (id) values (1)
on conflict (id) do nothing;


















do $$ begin perform cron.unschedule('rotate-log-aktivitas'); exception when others then null; end $$;
select cron.schedule(
  'rotate-log-aktivitas',
  '0 3 * * *',
  $$SELECT public.rotate_log_aktivitas();$$
);


do $$ begin perform cron.unschedule('jatuh-tempo-daily'); exception when others then null; end $$;
select cron.schedule(
  'jatuh-tempo-daily',
  '0 7 * * *',
  $$SELECT public.notify_jatuh_tempo();$$
);


do $$ begin perform cron.unschedule('daily-refresh-batch-produk'); exception when others then null; end $$;
select cron.schedule(
  'daily-refresh-batch-produk',
  '0 1 * * *',
  $$select public.refresh_status_batch_produk();$$
);


do $$ begin perform cron.unschedule('daily-refresh-batch-bahan-baku'); exception when others then null; end $$;
select cron.schedule(
  'daily-refresh-batch-bahan-baku',
  '5 1 * * *',
  $$select public.refresh_status_batch_bahan_baku();$$
);


do $$ begin perform cron.unschedule('clean-old-notifikasi'); exception when others then null; end $$;
select cron.schedule(
  'clean-old-notifikasi',
  '0 4 * * *',
  $$
    delete from public.notifikasi
    where
      (dibaca = true  and waktu < now() - interval '30 days')
      or
      (dibaca = false and waktu < now() - interval '90 days');
  $$
);



do $$ begin perform cron.unschedule('batalkan-pesanan-kedaluwarsa'); exception when others then null; end $$;
select cron.schedule(
  'batalkan-pesanan-kedaluwarsa',
  '*/15 * * * *',
  $$select public.batalkan_pesanan_kedaluwarsa(90)$$
);



do $$ begin perform cron.unschedule('rotate-empty-batches'); exception when others then null; end $$;
select cron.schedule(
  'rotate-empty-batches',
  '0 2 */90 * *',
  $$select public.rotate_empty_batches();$$
);

commit;
