


























begin;





delete from public.produksi;
delete from public.penjualan_langsung;
delete from public.pesanan_online;
delete from public.produk;




delete from public.enum_kategori_produk;
insert into public.enum_kategori_produk (nilai) values
  ('Roti Isi'),
  ('Roti Tawar'),
  ('Donat'),
  ('Bolu'),
  ('Aneka Jajan');







insert into public.produk
  (nama_produk, harga_satuan, stok_minimal, estimasi_kadaluarsa_hari, batas_peringatan_hari, status, kategori_produk)
select
  v.nama,
  v.harga,
  case when v.harga >= 40000 then 2 else 8 end,
  case when v.kategori in ('Bolu', 'Aneka Jajan') then 6 else 4 end,
  2,
  'Aktif'::public.status_produk,
  (select id from public.enum_kategori_produk where nilai = v.kategori)
from (values
  ('Roti Sobek Labu Kuning',     8000,  'Roti Tawar'),
  ('Roti Tawar Gandum',          22000, 'Roti Tawar'),
  ('Roti Tawar',                 12000, 'Roti Tawar'),
  ('Kue Lapis Surabaya',         45000, 'Bolu'),
  ('Kue Lapis Surabaya Mini',    4000,  'Bolu'),
  ('Chiffon Mini Coklat',        4000,  'Bolu'),
  ('Chiffon Mini Matcha',        4000,  'Bolu'),
  ('Chiffon Mini Tiramisu',      4000,  'Bolu'),
  ('Roti Abon',                  8000,  'Roti Isi'),
  ('Roti Paha Ayam',             3000,  'Roti Isi'),
  ('Roti Abon Gulung',           6000,  'Roti Isi'),
  ('Roti Sosis',                 8000,  'Roti Isi'),
  ('Roti Belah Coklat Kacang',   6000,  'Roti Isi'),
  ('Roti Belah Coklat',          6000,  'Roti Isi'),
  ('Roti Kering (Bagelen)',      8000,  'Roti Tawar'),
  ('Chiffon Coklat',             6000,  'Bolu'),
  ('Chiffon Sunkist Mini',       6000,  'Bolu'),
  ('Muffin Coklat',              7000,  'Bolu'),
  ('Muffin Vanila',              7000,  'Bolu'),
  ('Bolen Coklat Pisang',        10000, 'Aneka Jajan'),
  ('Kue Sus',                    10000, 'Bolu'),
  ('Chicco Moist Ovomaltine',    12000, 'Bolu'),
  ('Chicco Moist Matcha',        10000, 'Bolu'),
  ('Chicco Moist Coklat',        10000, 'Bolu'),
  ('Roti Nutella',               10000, 'Roti Isi'),
  ('Roti Kopi',                  10000, 'Roti Isi'),
  ('Roti Goreng isi Nutella',    10000, 'Roti Isi'),
  ('Roti Goreng isi Keladi',     5000,  'Roti Isi'),
  ('Roti Goreng isi Abon Ayam',  5000,  'Roti Isi'),
  ('Roti Kepang',                7000,  'Roti Isi'),
  ('Srikaya',                    12000, 'Aneka Jajan'),
  ('Bolu Gulung Coklat',         55000, 'Bolu'),
  ('Bolu Nenas',                 50000, 'Bolu'),
  ('Brownies Coklat',            55000, 'Bolu'),
  ('Chiffon Pandan',             45000, 'Bolu'),
  ('Chiffon Sunkist',            45000, 'Bolu'),
  ('Brownies 2 Rasa',            45000, 'Bolu'),
  ('12 Donut Mini Combo',        35000, 'Donat')
) as v(nama, harga, kategori);




do $$
declare
  v_staff   uuid;
  v_role    public.role_user;
  v_cust    uuid;
  v_prod    record;
  v_bp      record;
  v_bb      record;
  v_batch   integer;
  v_run     integer;
  v_prodids integer[] := '{}';
  v_batchids integer[] := '{}';
  v_initstok integer[] := '{}';
  v_runids  integer[] := '{}';
  v_n       integer;
  v_pos     integer;
  v_pid     integer;
  v_harga   numeric;
  v_qty     integer;
  v_total   numeric;
  v_sale    integer;
  v_ord     integer;
  v_status  public.status_pesanan;
  v_when    timestamp;
  d         integer;
  i         integer;
  k         integer;
  s         integer;
  li        integer;
  o         integer;
begin
  
  select id, role into v_staff, v_role
    from public.profiles
   where role in ('Kasir', 'Admin') and status = 'Aktif'
   order by case role when 'Kasir' then 0 else 1 end, created_at
   limit 1;
  if v_staff is null then
    select id, role into v_staff, v_role
      from public.profiles where status = 'Aktif' order by created_at limit 1;
  end if;
  if v_staff is null then
    raise exception 'Tidak ada user di profiles untuk dijadikan pembuat data seed.';
  end if;

  
  select id into v_cust
    from public.profiles
   where role = 'Pelanggan' and status = 'Aktif'
   order by created_at limit 1;

  
  for v_prod in
    select id_produk, harga_satuan, estimasi_kadaluarsa_hari
      from public.produk order by id_produk
  loop
    v_pos := coalesce(array_length(v_batchids, 1), 0) + 1;  
    if v_prod.harga_satuan >= 40000 then
      v_qty := 4 + (v_pos % 5);      
    else
      v_qty := 12 + (v_pos % 19);    
    end if;

    insert into public.batch_produk (id_produk, stok, tgl_produksi, kadaluarsa)
    values (
      v_prod.id_produk,
      v_qty,
      current_date - (v_pos % 2),
      (current_date - (v_pos % 2)) + v_prod.estimasi_kadaluarsa_hari
    )
    returning id_batch into v_batch;

    v_prodids  := array_append(v_prodids, v_prod.id_produk);
    v_batchids := array_append(v_batchids, v_batch);
    v_initstok := array_append(v_initstok, v_qty);
  end loop;
  v_n := array_length(v_prodids, 1);

  
  for d in 0..6 loop
    insert into public.produksi (id_user, waktu)
    values (v_staff, (current_date - d) + time '06:30')
    returning id_produksi into v_run;
    v_runids := array_append(v_runids, v_run);  
  end loop;

  
  for i in 1..v_n loop
    insert into public.detail_produksi_output (id_produksi, id_batch, jumlah)
    values (v_runids[1 + (i % 2)], v_batchids[i], v_initstok[i]);
  end loop;

  
  k := 0;
  for v_bb in
    select id_batch_bb from public.batch_bahan_baku order by id_batch_bb limit 21
  loop
    k := k + 1;
    insert into public.detail_produksi_input (id_produksi, id_batch_bb, jumlah)
    values (v_runids[1 + (k % 7)], v_bb.id_batch_bb, 1)
    on conflict do nothing;

    update public.batch_bahan_baku bb
       set stok = bb.stok - 1
      from public.bahan_baku b
     where bb.id_batch_bb = v_bb.id_batch_bb
       and b.id_bahan = bb.id_bahan
       and bb.stok - 1 > b.stok_minimal;
  end loop;

  
  for s in 0..15 loop
    insert into public.penjualan_langsung (id_user, tanggal, total, jenis_pembayaran)
    values (
      v_staff,
      (current_date - (s % 7)) + time '09:00' + (s * interval '17 minutes'),
      0,
      (array['Tunai','QRIS','Transfer Bank']::public.jenis_bayar[])[1 + (s % 3)]
    )
    returning id_penjualan into v_sale;

    v_total := 0;
    for li in 0..(s % 3) loop
      v_pos   := 1 + ((s * 3 + li) % v_n);
      v_pid   := v_prodids[v_pos];
      v_harga := (select harga_satuan from public.produk where id_produk = v_pid);
      v_qty   := 1 + ((s + li) % 3);

      insert into public.detail_penjualan_langsung (id_penjualan, id_produk, qty, harga_satuan)
      values (v_sale, v_pid, v_qty, v_harga);

      v_total := v_total + v_qty * v_harga;
    end loop;

    update public.penjualan_langsung set total = v_total where id_penjualan = v_sale;
  end loop;

  
  if v_cust is not null then
    for o in 0..7 loop
      v_status := (array['Selesai','Selesai','Selesai','Diproses','Diproses','Pending','Selesai','Pending']::public.status_pesanan[])[o + 1];
      v_when   := (current_date - (o % 7)) + time '13:00' + (o * interval '29 minutes');

      insert into public.pesanan_online (
        id_pelanggan, id_user, tanggal, waktu_antar, status, jenis_pembayaran,
        total_harga, nama_penerima, no_telp_penerima, alamat_pengiriman
      )
      values (
        v_cust, v_staff, v_when, v_when + interval '2 hours', v_status,
        (array['Tunai','Midtrans','QRIS']::public.jenis_bayar[])[1 + (o % 3)],
        0,
        'Penerima Demo ' || (o + 1),
        '0812' || lpad((3000000 + o)::text, 7, '0'),
        'Jl. Contoh No. ' || (o + 1) || ', Pematang Siantar'
      )
      returning id_pesanan into v_ord;

      v_total := 0;
      for li in 0..(o % 3) loop
        v_pos   := 1 + ((o * 3 + li) % v_n);
        v_pid   := v_prodids[v_pos];
        v_harga := (select harga_satuan from public.produk where id_produk = v_pid);
        v_qty   := 1 + ((o + li) % 2);

        
        insert into public.detail_pesanan_online (id_pesanan, id_produk, qty, harga_satuan)
        values (v_ord, v_pid, v_qty, v_harga);

        v_total := v_total + v_qty * v_harga;

        
        if v_status in ('Pending'::public.status_pesanan, 'Diproses'::public.status_pesanan) then
          insert into public.reservasi_stok_pesanan (id_pesanan, id_batch, qty)
          values (v_ord, v_batchids[v_pos], v_qty)
          on conflict do nothing;
        end if;
      end loop;

      update public.pesanan_online set total_harga = v_total where id_pesanan = v_ord;
    end loop;
  end if;

  
  k := 0;
  for v_bp in
    select id_batch from public.batch_produk order by id_batch limit 3
  loop
    k := k + 1;
    insert into public.masalah_produk
      (id_batch, id_user, tanggal, jumlah, keterangan, stok_dikurangi, nama_masalah)
    values (
      v_bp.id_batch, v_staff,
      (current_date - k) + time '15:00',
      2, 'Ditemukan saat pengecekan mutu harian.', 2,
      (array['Rusak','Cacat Produksi','Kedaluwarsa']::public.jenis_masalah_produk[])[k]
    );

    
    update public.batch_produk bp
       set stok = bp.stok - 2
      from public.produk p
     where bp.id_batch = v_bp.id_batch
       and p.id_produk = bp.id_produk
       and bp.stok - 2 > p.stok_minimal;
  end loop;

end $$;

commit;
