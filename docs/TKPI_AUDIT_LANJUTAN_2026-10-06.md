# KaloriKu v2.3.2 — audit lanjutan TKPI 2017/2020
Tanggal: 6 Oktober 2026

## Metode dan tingkat kepastian
Dokumen Kemenkes RI:
- Katalog TKPI 2017: https://repository.kemkes.go.id/book/777
- Katalog TKPI 2020: https://repository.kemkes.go.id/book/668
- Tabel 2017 yang dapat ditelusuri: https://id.scribd.com/document/625731397/8A9531C5-9DEE-482F-B067-5EF76C801224
- Transkripsi tabel 2020 (bukan PDF sumber primer): https://id.scribd.com/document/678341848/TKPI-Kemenkes-2020-Perhitungan-Gizi
- Salinan buku 2020 yang juga memuat kode dan tabel: https://studylib.net/doc/27788746/tkpi-2020

**Batas verifikasi:** metadata resmi katalog Kemenkes membuktikan keberadaan edisi 2017 dan 2020, sedangkan **angka pada pembaruan ini dicocokkan terhadap salinan/transkripsi 2020**. Hasil pencocokan **bukan** pengesahan ulang oleh Kemenkes, bukan pengukuran laboratorium, dan belum membuktikan semua nilai sesuai errata/hardcopy buku 2020. Beberapa transkripsi juga memperingatkan bahwa berkas lunak dapat mengalami kesalahan pengeditan.

## Hasil
- **26** entri TKPI yang sudah ada dilengkapi serat (g/100 g BDD), dan **24** di antaranya natrium (mg/100 g BDD), berdasarkan baris kode TKPI yang terlihat dalam transkripsi.
- **17** variasi porsi dihitung proporsional dari data tersebut. Angka turunan bukan analisis atau pengukuran baru.
- **1** entri `Ikan, tepung, mentah` dipadankan dengan GP039. Protein dinormalisasi dari 60,1 menjadi **60,0 g** agar sesuai baris transkripsi. Energi **316 kkal** dipertahankan, tetapi ditandai sebagai anomali energi-makro. Data serat 0 g dan natrium 320 mg/100 g diambil dari baris yang sama.
- **7** entri TKPI 2020 ditambahkan secara terpisah pada `data/foods-tkpi-2020.json`: nasi matang (AP001), nasi merah matang (AP005), susu kedelai (CP060), tahu mentah (CP061), tahu goreng (CP062), tahu telur (CP063), dan tauco (CP065).
- Total berkas katalog: **2.678 entri**. Setelah penyaringan 15 nama yang sama, terdapat **2.663 entri yang dapat dicari**: **269 TKPI**, **423 konversi porsi**, **1.971 estimasi**. Kolom serat tersedia pada **51** entri dan natrium pada **49** entri.

## Konsekuensi penggunaan
1. **Jangan menafsirkan data per 100 g BDD sebagai data per porsi, gelas, atau sebelum bagian yang tidak dimakan dibuang.** Variasi porsi yang dihitung ditandai `calculated`.
2. Kalori dan makronutrien pada sebagian entri TKPI menggunakan data sumber yang saling bertentangan. Menyamakan kalori dengan rumus 4/4/9 secara paksa akan menghapus rekaman sumber tanpa kepastian.
3. **Kacang tanah, rebus (CP013):** salinan TKPI 2017/2020 memuat lemak **28 g/100 g**, tetapi dataset lama menggunakan **18 g/100 g**. Nilai yang tercetak menghasilkan jumlah massa zat gizi utama dan air melampaui 100 g, sehingga angka tersebut perlu diselidiki melalui sumber primer/errata. **Tidak mengubah angka lemak 18 g tanpa konfirmasi; entri diubah statusnya menjadi `printed_source_conflict` dan peringatan muncul di kartu pangan.** Data ini tidak boleh disebut "sudah cocok dengan cetakan".
4. **Tujuh anomali energi-makro pada sumber TKPI** tetap ditandai, termasuk Beras Siger, Umbi Uwi, Tepung kacang kedelai, Kopi instan bubuk, Teh hijau kering, Teh melati kering, dan Ikan tepung mentah.
5. **Empat anomali masih berlabel estimasi**: Dendeng Daging Sapi, Ikan Bekasang, Jagung Sayur (tumis), dan Tepung Ikan. Baris yang belum mempunyai kecocokan kode jelas tidak diubah menjadi TKPI.
6. Nilai natrium seperti **447 mg pada kacang hijau rebus CP005** mengikuti tabel salinan tetapi bisa sangat dipengaruhi metode pembuatan, pengawetan, atau kesalahan sumber; bukan representasi setiap resep.
7. Katalog generik lama tetap ada. Misalnya estimasi nasi putih 100 g dapat berbeda dari nasi matang TKPI AP001 **180 kkal/100 g**. Keduanya memiliki sumber yang jelas dan tidak disatukan otomatis.
8. Zat gizi lain (serat/gula/natrium) yang belum memiliki data **tetap kosong, bukan nol**. Modul laporan bulanan telah mendukung nilai opsional tersebut sebelum pembaruan ini.
9. Pengubahan katalog **tidak mengedit** snapshot catatan makan yang sudah tersimpan di perangkat pengguna.

## Uji otomatis
- Sintaks `app.js`, `v17.js`, dan `sw.js`: valid.
- JSON semua katalog: dapat dibaca; semua ID unik; energi dan makronutrien berangka nonnegatif.
- Semua tujuh katalog tercantum dalam cache PWA, termasuk `data/foods-tkpi-2020.json`.
- `index.html` dan service worker beralih ke **v2.3.2**.
- Status CP013 dan GP039 diperiksa dengan assertion; 11 anomali ambang energi-makro masih terdeteksi dan tidak disembunyikan.
- **Keterbatasan QA:** belum dilakukan uji end-to-end pada perangkat Android pengguna atau konfirmasi status deployment GitHub Pages secara langsung.

## Tindak lanjut
1. Dapatkan citra halaman asli edisi 2020 serta informasi errata untuk CP013, BR033, BP021, CP086 dan empat kode pangan MP/GP yang bermasalah.
2. Jangan menambah serat/natrium untuk makanan olahan atau produk bermerek tanpa sumber item-level dan takaran pengujian yang sebanding.
3. Setelah verifikasi sumber primer, tentukan secara eksplisit apakah salah satu entri perlu koreksi, pemisahan varian resep, atau tetap diberi peringatan.
