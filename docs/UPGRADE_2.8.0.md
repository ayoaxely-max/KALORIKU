# KaloriKu 2.8.0

Takaran pribadi dapat dibuka dan disimpan langsung pada kartu di Database dan Tambah asupan. Pilih unit dan gram untuk satu takaran; data tetap memakai penyimpanan takaran yang ikut backup/sinkronisasi. Unit porsi gizi disunting melalui dialog Atur takaran; penyunting cepat tidak mengubah berat porsi gizi. Konversi ke kalori tetap membutuhkan berat porsi yang diketahui.

Ringkasan 7 hari ditambah rerata protein, perubahan berat badan dari dua tanggal yang ada dalam rentang, dan tabel harian. Grafik 14 hari kini memakai tanda — untuk hari tanpa catatan, serta rerata 7 hari yang hanya membagi hari tercatat. Catatan dengan kalori nol benar-benar tetap dihitung; hari kosong dikeluarkan. Ada catatan bukan bukti semua asupan dicatat lengkap. Tidak ada penafsiran atau anjuran klinis baru.

Service worker baru menunggu pengguna memilih Perbarui sekarang. Formulir terbuka, pemulihan backup, atau sinkronisasi berjalan memblokir pembaruan. Pilihan Nanti menyembunyikan pemberitahuan; Periksa pembaruan di Profil dapat menampilkannya kembali. Tab lain menerima pemberitahuan muat ulang tanpa memaksa membuang formulir. Versi sebelum 2.8.0 perlu dibuka ulang satu kali untuk memuat kontrol baru; mekanisme menunggu klik berlaku sesudahnya. IndexedDB tidak dihapus saat pembaruan.

Regresi: seluruh tes unit serta integrasi DOM/IndexedDB, termasuk takaran langsung, rerata hanya hari tercatat (dengan contoh nol yang valid), protein/BB mingguan, dan blokir pembaruan saat dialog atau sinkronisasi aktif.
