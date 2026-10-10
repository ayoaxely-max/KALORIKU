# KaloriKu 2.12.10

- Ambil foto langsung membuka input kamera dengan capture environment; Pilih dari Galeri langsung membuka pemilih galeri.
- Formulir foto menampilkan satu tombol sesuai sumber yang dipilih, sehingga tidak meminta pilihan kamera/galeri dua kali. Foto dapat diambil atau dipilih ulang melalui tombol tersebut.
- Saat penyimpanan berlangsung, tombol masuk tidak membuka pemilih baru atau mereset draft.
- Pemanggilan input tetap mengikuti klik pengguna secara sinkron. Browser/OS menentukan tampilan pemilih native; capture adalah petunjuk kamera, bukan jaminan semua browser membuka kamera langsung.

Validasi: npm test, npm run audit; pemilih kamera nyata di HP belum diuji.
