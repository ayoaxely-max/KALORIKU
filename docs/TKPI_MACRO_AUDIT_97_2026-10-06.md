# Audit energi dan makronutrien 97 entri — KaloriKu v2.3.5

Tanggal: 6 Oktober 2026.

## Hasil

- Seluruh 97 entri yang sebelumnya hanya dicocokkan nama/kode telah dibandingkan per baris untuk energi, protein, lemak, dan karbohidrat per 100 g BDD. Keempat angka cocok dengan salinan tabel TKPI 2020. Tidak ada angka gizi yang diubah.
- Bukti numerik per ID disimpan dalam `TKPI_MACRO_AUDIT_97_2026-10-06.json`. Audit otomatis membandingkan database dengan bukti ini agar perubahan berikutnya tidak diam-diam menyimpang.
- AP005 tetap alias dari `tkpi20_ap005`, bukan tambahan kode pangan unik.
- CP013 (kacang tanah rebus), di luar 97 entri, diperiksa secara visual pada PDF yang ditautkan katalog Kemenkes: halaman PDF 29 / halaman cetak 25. Buku mencetak 220 kkal, protein 10,6 g, lemak **18,0 g**, KH 8,0 g, serat 1,0 g, natrium 36 mg, BDD 100%. Konflik angka lemak 28 g pada transkripsi sekunder diselesaikan. Nilai database 18 g sudah benar sehingga dipertahankan.
- Kalio telur diperiksa pada PDF halaman 70 / halaman cetak 66: 193 kkal, protein 10,6 g, lemak 12,4 g, KH 9,7 g, BDD 100%. Tabel komposisi mencetak **HP007**, sedangkan indeks kode mencetak **HP008**. Database mempertahankan HP008 sesuai indeks dan merekam konflik tersebut secara eksplisit.
- Antarmuka menjelaskan perbedaan audit terhadap salinan dengan pemeriksaan PDF primer, serta menampilkan konflik kode. Cache aplikasi diperbarui ke v2.3.5.

## Sumber dan batas pemeriksaan

1. Katalog resmi Kemenkes: https://repository.kemkes.go.id/book/668
2. PDF yang ditautkan katalog: https://drive.google.com/file/d/1qJZO-Bz1PVHcxWd7Gj_4CPW72gNH_LRo/view
3. Salinan buku yang digunakan untuk pencocokan per baris 97 entri: https://es.scribd.com/document/524165409/TKPI-2020
4. Transkripsi yang memuat konflik CP013 (28 g): https://id.scribd.com/document/678341848/TKPI-Kemenkes-2020-Perhitungan-Gizi

Pemeriksaan 97 entri ini mencakup empat angka energi/makro. Pemeriksaan visual seluruh 97 baris pada PDF primer, BDD seluruh pangan, serat/natrium dan nutrien lain **belum lengkap**. Status tetap `transcription_crosschecked_original_pending` pada baris yang belum diperiksa penuh terhadap PDF primer; tidak dilabeli sebagai seluruh nilai gizi terverifikasi. BDD lama dipertahankan, dan bukan dikonfirmasi hanya dari angka terakhir hasil ekstraksi teks karena kolom kosong dapat menggeser posisi.

Sebelas anomali energi–makro yang telah dicatat sebelumnya tetap ditandai. Perbedaan dengan perhitungan 4/4/9 merupakan sinyal audit, bukan alasan otomatis mengubah angka sumber. Makanan estimasi dan hasil konversi porsi tidak mendapat status verifikasi laboratorium.

## Validasi

- Audit seluruh 2.678 rekaman pada tujuh katalog: 0 errors; 432 konversi porsi sesuai induk dalam toleransi pembulatan.
- Sepuluh tes pencarian/katalog/porsi regional lulus; pemeriksaan sintaks app.js dan sw.js lulus.
- Tes regional lama yang mengunci versi cache 2.2.0 diperbaiki agar memeriksa format versi cache, sehingga tetap menguji perilaku setelah pembaruan versi.
- ID, kalori/makronutrien, dan catatan konsumsi pengguna tidak diubah.

## Tindak lanjut yang masih terbuka

Lengkapi audit visual PDF primer dan BDD per baris sebelum menaikkan status 96 baris lainnya. Periksa sebelas anomali yang tersisa terhadap baris primer/ralat; pertahankan tanda ketidakpastian bila sumber memang anomali.
