# KaloriKu 2.12.9

- Tombol pemasangan tersedia di dashboard dan Profil tanpa menunggu browser menawarkan instalasi.
- Jika pemasangan langsung tidak tersedia, tombol membuka panduan shortcut sesuai perangkat: Chrome Android, Safari iOS, atau Chrome/Edge desktop.
- Pembatalan dan kegagalan prompt tetap menyediakan jalur mencoba ulang. Klik berulang tidak membuka prompt ganda.
- Aplikasi yang terpasang menampilkan status terpasang dan menonaktifkan tombol pemasangan.

Validasi: npm test, npm run audit. Uji instalasi memakai event browser tiruan di JSDOM; pemasangan fisik Android/iOS belum diuji.
