# KaloriKu 2.7.0

## Riwayat sinkronisasi
Profil menampilkan waktu unggah/unduh terakhir pada perangkat ini dan jumlah perubahan penyimpanan sejak snapshot yang berhasil diunggah. Riwayat disimpan lokal terpisah untuk setiap akun, tidak ikut backup atau enkripsi cloud. Versi sebelumnya belum merekam waktu, sehingga riwayat lama ditampilkan sebagai belum tercatat. Unduhan tercatat setelah dekripsi dan validasi, bukan bukti telah digabung. Penggabungan menampilkan pengingat unggah yang tetap ada setelah aplikasi dibuka ulang.

Angka menghitung transaksi penyimpanan data, bukan catatan unik. Menyimpan profil, air, takaran, atau favorit juga dihitung; transaksi foto beserta komponen dapat dihitung lebih dari satu. Perubahan saat unggahan berjalan tetap ditampilkan sebagai belum diunggah, karena patokan menggunakan revisi snapshot awal. Nol perubahan berarti tidak ada perubahan lokal sejak unggahan, bukan bukti cloud/perangkat lain belum berubah. Tidak ada unggahan atau pemeriksaan cloud otomatis. Metadata akun dan kegagalan jaringan tidak menambah hitungan data.

## Catat lagi
Hari Ini menampilkan maksimal lima makanan yang paling sering dicatat, dengan waktu terakhir sebagai pembanding jika frekuensi sama. Makanan yang tidak lagi tersedia serta catatan komponen foto tidak masuk pintasan. Tombol membuka formulir normal dengan tanggal hari ini, waktu makan dan jumlah porsi terakhir. Pengguna memeriksa dan menekan + sebelum tersimpan. Nilai gizi memakai entri makanan saat ini.

## Penanda pencarian
Database, tambah asupan, komponen foto, dan bahan resep menampilkan Cocok kata, Ejaan mendekati, atau Spasi disesuaikan. Cocok kata meliputi pencarian kata/prefix/alias dan singkatan yang dikenali, bukan jaminan nama penuh identik. Ejaan mendekati berasal dari pencocokan typo.

## Validasi
26 tes unit dan integrasi DOM + IndexedDB lulus. Pemeriksaan mencakup badge melalui hasil pencarian aktual, Catat lagi tidak mencatat tanpa tindakan pengguna, riwayat dipisahkan per akun, pengingat setelah merge, kegagalan unggah tidak memajukan waktu, dan perubahan saat unggah tidak ditandai sudah terkirim.
