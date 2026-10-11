# KaloriKu 2.13.0

- Panduan awal empat langkah di dashboard; dapat ditutup dan dibuka lagi melalui Profil.
- Status backup lokal, konfirmasi file telah tersimpan, dan pengingat inline setelah tujuh hari atau saat belum ada cadangan yang dikonfirmasi. Tanggal backup tidak disamakan dengan keberhasilan unduhan browser.
- Panduan pindah perangkat pada Data & backup, termasuk penjelasan pemulihan mengganti data tujuan serta pengaturan AI/kunci sinkronisasi perlu diatur ulang.
- Daftar produk barcode tersimpan dengan pencarian nama/kode dan koreksi angka dari label. Koreksi mempertahankan ID/barcode, memakai pemeriksaan revisi produk, dan tidak mengubah snapshot catatan makan lama.
- Status backup dan pilihan panduan disimpan khusus perangkat, tidak dimasukkan ke backup/sinkronisasi. Tidak ada notifikasi di luar aplikasi atau pengunduhan otomatis.

Validasi: npm test, npm run audit. Pengujian fisik kamera/pemasangan Android/iOS perlu dilakukan di perangkat nyata.
