# 2.10.3 — Pemeriksaan pembaruan yang jelas

Pengguna melaporkan tombol Periksa pembaruan tidak bisa diklik. Pada browser uji 2.10.2, tombol dapat diklik dan pusat tombol tidak tertutup navigasi. Masalah pada perangkat pengguna belum direproduksi. Alur sebelumnya hanya memberi toast singkat, tidak menjelaskan hasil pemeriksaan, dan tidak menunggu unduhan service worker selesai.

Kartu Aplikasi dipindahkan ke bagian atas Profil. Tombol memakai fungsi pemeriksaan khusus dengan status menetap dan aria-live. Pemeriksaan mencegah klik ganda, menampilkan unduhan, menunggu instalasi selesai, membedakan versi siap dari belum tersedia/offline/gagal, dan mengembalikan tombol sesudah kesalahan atau timeout. Jika registrasi hilang, aplikasi mencoba mendaftarkannya kembali. Pemeriksaan/instalasi dibatasi 15 detik per tahap.

Perbarui sekarang juga tersedia di kartu Aplikasi. Penggantian worker tetap memerlukan klik pengguna dan tetap diblokir selama formulir, restore, atau sinkronisasi berlangsung. Pembaruan dari tab lain dapat dimuat ulang melalui kedua tombol tanpa memakai referensi worker lama.

Tidak ada penghapusan IndexedDB atau permintaan menghapus data browser. Untuk membuka shell terbaru dari perangkat yang masih memakai tampilan lama, gunakan https://ayoaxely-max.github.io/KALORIKU/?v=2.10.3 di browser yang biasa dipakai.

Validasi: 26 unit test, integrasi DOM/IndexedDB, audit katalog. Integrasi mencakup status selesai, proses tertunda, kegagalan jaringan dan pengaktifan ulang tombol, worker siap, penantian instalasi, timeout, serta offline. Pengujian langsung pada HP pengguna belum dilakukan.
