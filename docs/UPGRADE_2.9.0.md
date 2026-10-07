# KaloriKu 2.9.0

Kartu makanan kini menampilkan rincian sumber, dasar porsi, dan status pemeriksaan. Status dibaca dari metadata audit yang ada, tanpa mengubah angka gizi. Pemeriksaan PDF primer hanya disebut untuk energi dan makro dengan status eksplisit. Salinan TKPI, estimasi, label, data komunitas, resep, dan konversi tetap dibedakan. Peringatan nilai tidak valid, konflik sumber, dan ketidaksesuaian energi ditampilkan untuk ditinjau, bukan bukti otomatis data salah. Tidak dilakukan audit primer baru pada seluruh katalog.

Pencarian dengan hasil terbaik yang mendekati menampilkan maksimal tiga saran “Maksud Anda”. Klik saran hanya mengubah pencarian; tidak mencatat asupan.

Favorit yang sudah tersedia kini dapat diakses di Hari Ini. Klik favorit membuka formulir normal dengan satu porsi, tanpa langsung menyimpan. Favorit tetap memakai penyimpanan, backup dan sinkronisasi yang sama.

Salin kemarin membuka pratinjau: pilih item, ubah jumlah porsi dan waktu makan, pilih tanggal tujuan. Catatan tujuan tetap dipertahankan; konfirmasi kedua yang disengaja dapat membuat catatan tambahan. Nilai gizi memakai snapshot catatan asal. Item terkait foto dikecualikan dengan pemberitahuan agar tidak membuat tautan foto yang keliru. Simpan seluruh pilihan dalam satu transaksi IndexedDB; perubahan/penghapusan catatan asal di perangkat atau tab lain membatalkan transaksi. Pembatalan dan klik ganda tidak menyimpan item tambahan. Formulir terbuka memblokir pembaruan PWA.

Validasi: 26 unit test, integrasi DOM/IndexedDB termasuk saran tanpa autosimpan, favorit, pratinjau batal, edit porsi, kompatibilitas backup, serta rollback saat sumber berubah. Audit katalog: 2.678 entri mentah, 0 kesalahan struktur, 16 peringatan yang masih perlu ditinjau. Pengujian HP fisik dan lintas perangkat pengguna belum dilakukan.
