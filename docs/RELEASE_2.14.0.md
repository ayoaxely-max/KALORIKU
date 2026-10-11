# KaloriKu 2.14.0 — pilihan gramasi sekali makan

Tombol + pada hasil pencarian membuka konfirmasi jumlah. Pilihan praktis yang diberi label perkiraan:

| Makanan | Pilihan gram | Pilihan awal |
|---|---|---|
| Nasi putih/merah/hitam | 100 / 150 / 200 | 150 |
| Tempe | 25 / 50 / 75 | 50 |
| Tahu | 50 / 100 / 150 | 100 |
| Telur ayam/olahan telur umum | 50 / 55 / 60 | 55 |
| Lauk hewani | 50 / 75 / 100 | 75 |
| Sayur | 75 / 100 / 150 | 100 |
| Buah | 80 / 100 / 150 | 100 |
| Umbi/jagung/mi rebus atau kukus kategori makanan pokok | 100 / 150 / 200 | 150 |

Angka di atas adalah pilihan UI untuk pencatatan, bukan hasil survei porsi paling sering dikonsumsi, bukan resep diet individual, dan bukan konversi baku satu potong/butir. Rujukan konsep pembagian sekali makan: https://ayosehat.kemkes.go.id/isi-piringku-kebutuhan-gizi-harian-seimbang . Artikel tersebut tidak menetapkan seluruh angka gram di tabel ini.

Untuk bahan mentah/kering/tepung dan hidangan yang tidak dipetakan, pilihan berasal dari setengah, satu, dan satu setengah berat porsi database. Porsi database tidak dianggap otomatis sebagai porsi sekali makan. Selalu sesuaikan kondisi mentah/matang dan timbang bagian yang dimakan.

Gramasi sendiri tetap dapat diisi, termasuk desimal. Kalori dan makro ditampilkan sebelum konfirmasi. Jika berat gram belum diketahui (misalnya minuman hanya memiliki ml), pilihan menggunakan jumlah porsi; tidak ada asumsi 1 ml = 1 g. Atur takaran pribadi tetap tersedia.

Tidak ada penulisan sebelum konfirmasi. Pembatalan tidak menyimpan; kegagalan menyimpan mempertahankan isian untuk dicoba ulang. Catatan sebelumnya dan database gizi tidak ditulis ulang. Input cepat, paket, dan foto mempertahankan alur masing-masing.

Validasi: tes pilihan makanan/bahan mentah, ml tanpa berat, gramasi custom 123,5 g, konversi resep dengan berat eksplisit dan takaran pribadi, negatif ditolak, batal tanpa menyimpan, kegagalan simpan serta percobaan ulang tanpa duplikat. npm test dan npm run audit. Pengujian fisik HP masih diperlukan.
