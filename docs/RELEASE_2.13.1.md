# KaloriKu 2.13.1

- Umur cadangan dihitung dari waktu ekspor file, bukan waktu konfirmasi. File berumur delapan hari tetap memunculkan pengingat meskipun baru dikonfirmasi tersimpan. Profil menampilkan kedua tanggal; tanggal ekspor di masa depan atau setelah konfirmasi ditolak sebagai status yang tidak valid.
- Saat pemulihan telah dikonfirmasi, tombol Batal dinonaktifkan dan Escape tidak menutup dialog. Status tetap terlihat sampai transaksi berhasil atau gagal. Setelah selesai, tombol kembali tersedia.

Validasi: kasus kegagalan direproduksi sebelum perbaikan melalui JSDOM dan fake-indexeddb; npm test dan npm run audit. Pengujian kamera, pemasangan, keyboard dan pemindahan pada HP nyata masih memerlukan perangkat fisik.
