
























begin;

delete from public.produk;             
delete from public.pesanan_online;     
delete from public.penjualan_langsung; 
delete from public.notifikasi;
delete from public.log_aktivitas;

commit;
