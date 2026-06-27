
































begin;


alter table public.batch_produk
  add column if not exists id_produksi integer null;

alter table public.batch_produk
  drop constraint if exists batch_produk_id_produksi_fkey;
alter table public.batch_produk
  add constraint batch_produk_id_produksi_fkey
  foreign key (id_produksi) references public.produksi (id_produksi) on delete set null;

create index if not exists idx_batch_produk_produksi
  on public.batch_produk using btree (id_produksi) tablespace pg_default;

alter table public.batch_produk
  add column if not exists jumlah_awal integer null;


do $$
begin
  if to_regclass('public.detail_produksi_output') is not null then
    update public.batch_produk bp
       set id_produksi = dpo.id_produksi
      from public.detail_produksi_output dpo
     where dpo.id_batch = bp.id_batch
       and bp.id_produksi is null;

    update public.batch_produk bp
       set jumlah_awal = dpo.jumlah
      from public.detail_produksi_output dpo
     where dpo.id_batch = bp.id_batch
       and bp.jumlah_awal is null;
  end if;
end $$;


update public.batch_produk
   set jumlah_awal = stok
 where jumlah_awal is null;

alter table public.batch_produk
  alter column jumlah_awal set not null;

drop table if exists public.detail_produksi_output;



alter table public.batch_produk
  drop column if exists tgl_produksi;


drop policy if exists produksi_select_kasir on public.produksi;
create policy produksi_select_kasir on public.produksi
  for select to public using (my_role() = 'Kasir'::role_user);


create table if not exists public.pemakaian_bahan (
  id_pemakaian serial not null,
  id_user uuid not null,
  id_batch_bb integer not null,
  jumlah numeric(10, 2) not null,
  waktu timestamp without time zone not null default now(),
  constraint pemakaian_bahan_pkey primary key (id_pemakaian),
  constraint pemakaian_bahan_id_user_fkey foreign key (id_user) references public.profiles (id) on delete cascade,
  constraint pemakaian_bahan_id_batch_bb_fkey foreign key (id_batch_bb) references public.batch_bahan_baku (id_batch_bb) on delete cascade
) tablespace pg_default;

create index if not exists idx_pemakaian_bahan_batch on public.pemakaian_bahan using btree (id_batch_bb) tablespace pg_default;
create index if not exists idx_pemakaian_bahan_waktu on public.pemakaian_bahan using btree (waktu) tablespace pg_default;

alter table public.pemakaian_bahan enable row level security;
drop policy if exists pemakaian_bahan_all_produksi_admin on public.pemakaian_bahan;
create policy pemakaian_bahan_all_produksi_admin on public.pemakaian_bahan
  for all to public using (my_role() = any (array['Produksi'::role_user, 'Admin'::role_user]));




do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pemakaian_bahan'
     ) then
    alter publication supabase_realtime add table public.pemakaian_bahan;
  end if;
end $$;



do $$
begin
  if to_regclass('public.detail_produksi_input') is not null then
    insert into public.pemakaian_bahan (id_user, id_batch_bb, jumlah, waktu)
    select p.id_user, dpi.id_batch_bb, dpi.jumlah, p.waktu
      from public.detail_produksi_input dpi
      join public.produksi p on p.id_produksi = dpi.id_produksi;

    drop table public.detail_produksi_input;

    
    
    delete from public.produksi p
     where not exists (select 1 from public.batch_produk b where b.id_produksi = p.id_produksi);
  end if;
end $$;

commit;
