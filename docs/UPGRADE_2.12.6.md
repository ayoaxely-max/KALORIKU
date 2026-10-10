# KaloriKu 2.12.6

- Profil, paket favorit, dan daftar favorit baru diperbarui di memori setelah transaksi IndexedDB berhasil.
- Kegagalan penyimpanan menampilkan pesan dan memungkinkan percobaan ulang. Profil mempertahankan isian yang belum tersimpan.
- Pengiriman berulang selama penyimpanan berlangsung diblokir dan kontrol terkait dinonaktifkan sementara.
- Pemilihan jenis kelamin hanya mengubah isian formulir, tidak mengubah profil aktif sebelum penyimpanan berhasil atau menghapus isian lain.
- Uji integrasi menggunakan kegagalan transaksi KV untuk ketiga alur: memori, penyimpanan, dan revisi harus tetap; retry harus berhasil; klik berulang harus menghasilkan satu transaksi. Profil dan paket diverifikasi bertahan setelah database dibuka ulang.

Validasi: npm test, npm run audit.
