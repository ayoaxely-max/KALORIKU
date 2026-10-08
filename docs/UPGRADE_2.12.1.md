# 2.12.1 — Pesan dan alur barcode

Nomor terbaca ditampilkan di kolom manual dan status. Pencarian membedakan produk tidak tersedia (404/not found), nama atau gizi tidak lengkap, offline, HTTP error, koneksi/respons gagal, timeout 15 detik, dan gagal menyimpan. Nama produk saja tidak cukup untuk menyimpan makanan; kalori, protein, karbohidrat, lemak harus tersedia sebagai angka nonnegatif, termasuk nol eksplisit.

Tombol Isi dari label kemasan membuka formulir dengan barcode dan nama yang tersedia, tanpa menebak gizi. Scan ulang dan Enter untuk pencarian manual. Kamera berhenti setelah nomor terbaca; request dibatalkan saat dialog ditutup dan hasil lama tidak membuka ulang dialog. Format detektor dipilih dari dukungan browser.

Validasi: npm test dan npm run audit. Integrasi menguji 404, gangguan koneksi, 503, data parsial, formulir manual, request selesai setelah tutup, simpan data lengkap termasuk nol dan pencarian offline lokal. Kamera HP fisik tidak dapat diuji di lingkungan ini.
