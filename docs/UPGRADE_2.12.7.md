# KaloriKu 2.12.7

- Takaran gram dikonversi memakai rasio sebenarnya tanpa dinaikkan ke minimum 0,01 porsi. Contoh 0,1 g dari porsi 100 g tetap 0,001 porsi, bukan 1 g.
- Input porsi langsung juga tidak dinaikkan diam-diam; jumlah yang tidak finite atau tidak positif ditolak. Batas input HTML tetap berlaku pada UI, tetapi handler tidak mengubah nilai positif yang diterimanya.
- Tes integrasi memeriksa 0,1 g dan 0,5 g, nilai tersimpan, porsi langsung kecil, serta penolakan nol.
- Perbaikan paket versi 2.12.5 tetap digunakan dan diuji: transaksi atomik, rollback item kedua, revisi tidak berubah pada kegagalan, dan klik ganda hanya menyimpan satu paket.
- Aset runtime dan cache service worker diperbarui ke 2.12.7. Catatan lama tidak dihitung ulang otomatis.

Validasi: npm test dan npm run audit. Pengujian kamera, cache dan IndexedDB pada Chrome perangkat nyata tetap perlu dilakukan.
