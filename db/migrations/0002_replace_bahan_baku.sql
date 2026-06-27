





































begin;




delete from public.bahan_baku;





delete from public.enum_jenis_bahan
 where nilai in ('Susu & Telur', 'Ragi & Pengembang', 'Perisa & Topping');

insert into public.enum_jenis_bahan (nilai) values
  ('Susu'),
  ('Telur'),
  ('Ragi'),
  ('Pengembang'),
  ('Perisa'),
  ('Topping'),
  ('Isian'),
  ('Agar-agar'),
  ('Kemasan')
on conflict (nilai) do nothing;

insert into public.enum_satuan (nilai) values
  ('pak'),
  ('sak'),
  ('pail')
on conflict (nilai) do nothing;






insert into public.bahan_baku (merek, stok_minimal, batas_peringatan_hari, status, jenis_bahan, satuan)
select
  v.merek,
  1,
  3,
  'Aktif'::public.status_bahan,
  (select id from public.enum_jenis_bahan where nilai = v.jenis),
  (select id from public.enum_satuan      where nilai = v.satuan)
from (values
  
  ('Segitiga Biru',                 'Tepung',     'kg'),
  ('Tepung Cakra Kembar',           'Tepung',     'kg'),
  ('Fazio',                         'Tepung',     'kg'),
  ('Zeelandia Chiffon Mix',         'Tepung',     'kg'),
  ('Zeelandia Muffin Mix Vanilla',  'Tepung',     'kg'),
  ('Zeelandia Muffin Mix Chocolate','Tepung',     'kg'),
  ('Zeelandia Kue Sus Mix',         'Tepung',     'kg'),
  ('Zeelandia Choco Moist Mix',     'Tepung',     'kg'),
  ('Zeelandia Instan Mix Chocolate','Tepung',     'kg'),
  ('Muffin Komersial',              'Tepung',     'kg'),

  
  ('Gula PSM',                      'Gula',       'kg'),
  ('Gula Vit',                      'Gula',       'kg'),
  ('Gula Dingin Komersial',         'Gula',       'kg'),

  
  ('Simas Margarin',                'Lemak',      'kg'),
  ('Amanda Bakers Fat',             'Lemak',      'kg'),
  ('Butter Palmvita',               'Lemak',      'pail'),

  
  ('Carlo Pan Grease',              'Minyak',     'kg'),

  
  ('Susu RH',                       'Susu',       'kg'),

  
  ('Athena Eggwash',                'Telur',      'kg'),

  
  ('Blue CF',                       'Ragi',       'dus'),

  
  ('Athena Bread Improver',         'Pengembang', 'kg'),
  ('Bakerine 500',                  'Pengembang', 'dus'),

  
  ('Maslan Taro',                   'Perisa',     'ml'),
  ('Parsley Komersial',             'Perisa',     'pcs'),

  
  ('Ceres Pasta',                   'Isian',      'dus'),
  ('Chocolate Pasta Komersial',     'Isian',      'dus'),
  ('Pasta Moca Komersial',          'Isian',      'pcs'),
  ('Maslan Kopi',                   'Isian',      'pcs'),
  ('Nut Plain Besar',               'Isian',      'pak'),
  ('Nanao Genoz Tiramisu',          'Isian',      'kg'),
  ('Yuai Pandan',                   'Isian',      'pcs'),
  ('Paleta Vla Cheese',             'Isian',      'kg'),
  ('Axeller Vla Srikaya Pandan',    'Isian',      'kg'),
  ('Filling A2',                    'Isian',      'sak'),

  
  ('Great Lion Chocolate Sprinkle', 'Topping',    'kg'),
  ('Lion Moka',                     'Topping',    'pcs'),
  ('Lion Dark',                     'Topping',    'pcs'),
  ('Lion Pisang',                   'Topping',    'kg'),
  ('Lion Pisang Lemon',             'Topping',    'pcs'),
  ('Ceres 168',                     'Topping',    'dus'),
  ('Ceres Hatari',                  'Topping',    'dus'),
  ('Inova Hijau',                   'Topping',    'dus'),
  ('Glaze Monaco Tiramisu',         'Topping',    'kg'),
  ('Glaze Monaco Dark',             'Topping',    'kg'),
  ('Manik Manik Komersial',         'Topping',    'kg'),
  ('Wijen Komersial',               'Topping',    'kg'),
  ('Almond Slice Komersial',        'Topping',    'kg'),
  ('Kismis Komersial',              'Topping',    'kg'),
  ('Kacang Jawa Komersial',         'Topping',    'kg'),
  ('Crumble Oreo Crumb',            'Topping',    'pak'),
  ('Walet',                         'Topping',    'kg'),
  ('Abon Ayam Abadi',               'Topping',    'dus'),
  ('Abon Ayam Pedas',               'Topping',    'kg'),

  
  ('Swallow Agar',                  'Agar-agar',  'pak'),
  ('Swallow Plain',                 'Agar-agar',  'pak'),

  
  ('Mika Burger',                   'Kemasan',    'pak'),
  ('Plastik Roti 13x15',            'Kemasan',    'pak'),
  ('Plastik Roti 16x18',            'Kemasan',    'pak'),
  ('OPP 11x11',                     'Kemasan',    'pak'),
  ('Alas JJ Bulat',                 'Kemasan',    'pak'),
  ('18x18 Gelombang',               'Kemasan',    'pcs')
) as v(merek, jenis, satuan);







delete from public.enum_satuan
 where id not in (select satuan from public.bahan_baku);

commit;
