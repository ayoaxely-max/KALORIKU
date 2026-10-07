# 2.11.0 — Navigasi tanggal dashboard

Dashboard utama dapat berpindah ke hari sebelumnya/berikutnya melalui panah, tombol Kemarin/Hari ini, pemilih tanggal, atau geser horizontal pada bilah tanggal. Hari setelah hari ini tidak dapat dipilih; geser vertikal tetap menggulir halaman. Navigasi bawah memakai label Dashboard agar tidak menyebut Hari Ini saat sedang melihat masa lalu.

Kalori, makro, jumlah item, kelompok makan, foto dan air minum mengikuti tanggal yang dipilih. Target kalori/makro/air menggunakan profil saat ini; aplikasi belum menyimpan riwayat target. Pada tanggal lampau, catatan penjelasan memperjelas hal ini.

Catat, Favorit, Catat lagi, dan Catat BB menyiapkan tanggal yang dipilih. Air minum disimpan pada tanggal terpilih saat transaksi dimulai. Simpan paket mengambil makanan tanggal dashboard, bukan selalu hari ini. Salin kemarin hanya ditampilkan pada hari ini agar makna sumber/tujuan tidak rancu. Tanggal Riwayat tetap independen. Tidak ada migrasi atau perubahan catatan lama hanya karena pengguna berpindah tanggal.

Validasi: 26 unit test dan integrasi DOM/IndexedDB. Integrasi memeriksa kalori berbeda per hari, air dan foto terpilih, tanggal form makanan/BB, perubahan air yang tidak menyentuh hari lain, kembali hari ini, penolakan tanggal invalid/masa depan, serta swipe horizontal dan scroll vertikal. Audit katalog lulus.
