# KaloriKu 2.12.5

- Paket makanan disimpan dalam satu transaksi IndexedDB bersama status sinkronisasi dan revisi. Kegagalan salah satu item membatalkan seluruh paket. Memori dan dashboard berubah setelah transaksi selesai.
- Tombol paket diblokir saat menyimpan untuk menghindari penambahan ganda dari klik berulang. Kegagalan menampilkan pesan dan memungkinkan mencoba ulang.
- Simpan berat badan menangani kegagalan penyimpanan, mempertahankan isian dan dialog, serta menampilkan petunjuk mencoba ulang. Pengiriman berulang dan penutupan dialog saat proses berlangsung diblokir.
- Regresi integrasi menguji rollback kegagalan item kedua, revisi tidak berubah, percobaan ulang tanpa duplikasi, dan gagal simpan berat badan beserta percobaan ulang.

Validasi: npm test dan npm run audit.
