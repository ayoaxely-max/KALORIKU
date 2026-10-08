# 2.12.0 — Dashboard ringkas dan rekap bulanan

Riwayat dipindahkan ke pojok header; tombol membuka tanggal dashboard terpilih. Navigasi bawah memakai empat tab. Pemilih tanggal, jumlah air khusus, favorit, menu berulang, salin menu, dan berat badan memakai panel lipat agar dashboard lebih ringkas.

Rekap bulanan di bawah catatan makanan memakai snapshot log × jumlah porsi, air minum dan berat badan bertanggal. Hari tanpa catatan ditampilkan sebagai —; rata-rata kalori dan protein hanya memakai hari dengan log makanan, air hanya hari yang memiliki catatan air (termasuk nilai nol eksplisit). Bulan berjalan hanya sampai hari ini. Rincian harian membuka Riwayat. Rekap diperbarui setelah perubahan makanan, air, berat badan dan pemulihan/sinkronisasi yang merender aplikasi.

Validasi: npm test (unit + DOM/IndexedDB), npm run audit. Integrasi mencakup tanggal Riwayat, tahun kabisat, pergantian tahun, jumlah porsi, nol vs kosong, bulan kosong, navigasi bulan dan tanggal rincian.
