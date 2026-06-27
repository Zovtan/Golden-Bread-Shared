























do $$
declare
  v_user   uuid;
  v_role   public.role_user;
  v_sup    integer[];
  v_pemb   integer[];
  v_status public.status_pembayaran;
  v_b      record;
  v_i      integer := 0;
  v_pid    integer;
  v_tgl    date;
  v_kdl    date;
  v_jml    numeric;
  v_harga  numeric;
  v_bb     record;
  v_jenis_masalah public.jenis_masalah_bahan;
begin
  
  select id, role into v_user, v_role
    from public.profiles
   where role = 'Admin' and status = 'Aktif'
   order by created_at
   limit 1;

  if v_user is null then
    select id, role into v_user, v_role
      from public.profiles order by created_at limit 1;
  end if;

  if v_user is null then
    raise exception 'Tidak ada baris di profiles untuk dijadikan pembuat data seed.';
  end if;

  
  with ins as (
    insert into public.supplier (nama_supplier, alamat, no_telp) values
      ('CV Sumber Boga',            'Jl. Merdeka No. 12, Pematang Siantar',    '0622-21345'),
      ('Toko Bahan Kue Sejahtera',  'Jl. Sutomo No. 45, Pematang Siantar',     '0622-22456'),
      ('UD Mitra Bakery',           'Jl. Diponegoro No. 8, Pematang Siantar',  '0622-23567')
    returning id_supplier
  )
  select array_agg(id_supplier order by id_supplier) into v_sup from ins;

  
  with ins as (
    insert into public.pembelian_bahan
      (id_user, id_supplier, tanggal, status_pembayaran, jatuh_tempo, no_faktur)
    select
      v_user,
      v_sup[1 + (g % array_length(v_sup, 1))],
      (current_date - g) + time '10:30',
      (array['Lunas','Lunas','Tempo','Belum']::public.status_pembayaran[])[1 + (g % 4)],
      case when (array['Lunas','Lunas','Tempo','Belum'])[1 + (g % 4)] = 'Tempo'
           then (current_date - g) + 14 else null end,
      'FKT-' || to_char(current_date - g, 'YYYYMMDD') || '-' || (100 + g)
    from generate_series(0, 6) as g
    returning id_pembelian
  )
  select array_agg(id_pembelian order by id_pembelian) into v_pemb from ins;

  
  
  for v_b in
    select b.id_bahan, b.merek, ej.nilai as jenis
      from public.bahan_baku b
      join public.enum_jenis_bahan ej on ej.id = b.jenis_bahan
     order by b.id_bahan
  loop
    v_pid := v_pemb[1 + (v_i % array_length(v_pemb, 1))];
    select tanggal::date into v_tgl from public.pembelian_bahan where id_pembelian = v_pid;

    
    v_jml   := (array[5, 10, 15, 25, 4, 8, 12, 20])[1 + (v_i % 8)];
    v_harga := 18000 + (v_i % 9) * 9500;   

    
    if v_b.jenis = 'Kemasan' then
      v_kdl := null;
    else
      v_kdl := v_tgl + (60 + (v_i % 6) * 30);
    end if;

    insert into public.detail_pembelian_bahan
      (id_pembelian, id_bahan, merek, jumlah, harga_satuan, kadaluarsa)
    values (v_pid, v_b.id_bahan, v_b.merek, v_jml, v_harga, v_kdl);

    insert into public.batch_bahan_baku
      (id_bahan, id_pembelian, stok, tgl_beli, kadaluarsa)
    values (v_b.id_bahan, v_pid, v_jml, v_tgl, v_kdl);

    v_i := v_i + 1;
  end loop;

  
  v_i := 0;
  for v_bb in
    select id_batch_bb, stok from public.batch_bahan_baku
     order by id_batch_bb limit 3
  loop
    v_jenis_masalah := (array['Rusak','Kualitas Buruk','Terkontaminasi']::public.jenis_masalah_bahan[])[1 + v_i];

    insert into public.masalah_bahan_baku
      (id_batch_bb, id_user, tanggal, jumlah, keterangan, stok_dikurangi, nama_masalah)
    values (
      v_bb.id_batch_bb, v_user,
      (current_date - v_i) + time '14:00',
      1, 'Ditemukan saat pengecekan stok rutin.', 1, v_jenis_masalah
    );

    
    update public.batch_bahan_baku
       set stok = greatest(stok - 1, 0)
     where id_batch_bb = v_bb.id_batch_bb;

    v_i := v_i + 1;
  end loop;

  
  insert into public.log_aktivitas (id_user, role_saat_itu, aktivitas, modul, detail, "timestamp")
  values
    (v_user, v_role, 'LOGIN',  'Autentikasi',    'Login ke sistem',                 (current_date - 6) + time '08:05'),
    (v_user, v_role, 'CREATE', 'Pembelian Bahan','Mencatat pembelian bahan baku',   (current_date - 6) + time '10:31'),
    (v_user, v_role, 'CREATE', 'Pembelian Bahan','Mencatat pembelian bahan baku',   (current_date - 5) + time '10:32'),
    (v_user, v_role, 'UPDATE', 'Bahan Baku',     'Memperbarui data bahan baku',     (current_date - 4) + time '11:15'),
    (v_user, v_role, 'CREATE', 'Pembelian Bahan','Mencatat pembelian bahan baku',   (current_date - 3) + time '10:33'),
    (v_user, v_role, 'CREATE', 'Masalah Bahan',  'Melaporkan masalah bahan baku',   (current_date - 2) + time '14:05'),
    (v_user, v_role, 'LOGIN',  'Autentikasi',    'Login ke sistem',                 (current_date - 1) + time '08:10'),
    (v_user, v_role, 'LOGOUT', 'Autentikasi',    'Logout dari sistem',              (current_date - 1) + time '17:02');

end $$;
