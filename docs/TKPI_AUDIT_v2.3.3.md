# KaloriKu v2.3.3 — audit TKPI, buah dan konsistensi porsi
Tanggal: 6 Oktober 2026

## Hasil yang sudah diterapkan
1. **Pepaya segar (ER073)** dikoreksi dari **39 menjadi 46 kkal/100 g BDD**, dari 9,81 menjadi **12,2 g karbohidrat**, dan dari 0,14 menjadi **0,1 g lemak**; protein tetap 0,5 g. Sumber: baris ER073 pada transkripsi TKPI 2020.
2. **Empat porsi pepaya** disinkronkan: 50 g 23 kkal; 150 g 69 kkal; 200 g 92 kkal; 250 g 115 kkal. Nilai turunannya dihitung proporsional (bukan pengukuran baru).
3. **11 pangan buah/umbi** mendapat kode TKPI, serat, natrium, dan metadata pemeriksaan baris dari salinan TKPI 2020: Belimbing ER006, Bengkuang BR005, Buah Naga Merah ER012, Buah Naga Putih ER013, Langsat ER051, Lemon ER052, Pepaya Muda DR133, Pepaya ER073, Pisang Ambon ER074, Pisang Kepok ER081, dan Pisang Lampung ER084.
4. **9 entri porsi turunan** yang sebelumnya salah diklasifikasikan sebagai `source_type:tkpi` kini `source_type:calculated` dengan `portion_derived_from` dan `portion_multiplier`. ID makanan, nama, dan data konsumsi pribadi pengguna tidak diganti.
5. **97 entri TKPI lama tanpa kode baris yang tercatat** kini memiliki `verification_status:code_not_recorded`; angka tidak dihapus maupun dinaikkan statusnya menjadi terverifikasi.
6. Antarmuka membedakan **TKPI (rujukan)**, **TKPI (kode belum dicatat)** dan **TKPI (konversi)**. Tahun tabel yang hanya dicocokkan silang tidak lagi keliru ditampilkan seolah edisi asli entri tersebut.
7. Audit programatik lintas semua katalog tersedia di `scripts/audit-foods.cjs` dan dijadwalkan oleh GitHub Actions di `.github/workflows/audit-foods.yml` untuk setiap push/PR yang mengubah katalog.

## Statistik database
- **2.678** entri mentah pada 7 file JSON.
- **2.663** nama unik yang ditampilkan aplikasi; 15 nama setara otomatis disaring di pencarian.
- Kategori entri mentah: **260 TKPI** per 100 g BDD, **432** konversi porsi TKPI, dan **1.986** estimasi.
- **97 dari 260** TKPI per 100 g BDD belum memiliki kode baris yang tercatat.
- Kolom serat terisi pada **69** entri; natrium terisi pada **67** entri. Kolom kosong bukan berarti 0.
- **11** selisih energi-makronutrien yang melewati ambang audit tetap tercatat. Konflik lemak kacang tanah rebus CP013 juga diberi status tersendiri karena metode 4/4/9 saja tidak mendeteksinya.

## Sumber dan batas verifikasi
- Buku resmi TKPI 2020 tercatat di katalog Perpustakaan Kementerian Kesehatan: https://repository.kemkes.go.id/book/668 .
- Nilai yang dipadankan dalam pembaruan ini dibaca dari transkripsi terbuka: https://id.scribd.com/document/678341848/TKPI-Kemenkes-2020-Perhitungan-Gizi .
- **Transkripsi bukan salinan resmi yang sudah dibuktikan identik dengan buku asli**, dan bahkan memperingatkan bahwa penyalinan/editor dapat menyebabkan perbedaan nilai. Metadata menyatakan `transcription_crosschecked_original_pending`.
- Penting khusus ER073: angka lama 39 kkal adalah data yang dulu berlabel TKPI di aplikasi, tetapi tidak cocok dengan baris transkripsi ER073 (46 kkal). Koreksi dilakukan untuk konsistensi dengan rujukan yang tersedia, dengan catatan bahwa buku asli/errata masih perlu diperiksa.
- Angka **BDD** berlaku untuk berat bahan yang dapat dimakan. Porsi, gelas, dan centong diukur secara terpisah.
- Catatan makan yang telah disimpan dalam IndexedDB menyimpan snapshot gizi ketika dicatat; catatan lama **tidak dihitung ulang secara otomatis** saat database diperbarui. Jika pemilik ingin merevisi rekaman lama, perlu tinjauan manual agar riwayat tidak berubah diam-diam.

## Uji yang sudah dilaksanakan
- Audit menyeluruh pada data GitHub terbaru dengan eksekusi skrip Node melalui shim filesystem (fungsi pembaca diarahkan ke isi file GitHub): **0 errors**.
- Semua **432** varian turunan terhubung ke pangan TKPI induk dan sesuai pengali porsi di bawah toleransi pembulatan (0,155 satuan).
- ID tidak berulang; nilai gizi inti numerik nonnegatif.
- Syntax kode aplikasi dan service worker diperiksa terpisah.
- Pipeline GitHub Actions telah ditambahkan, tetapi keberhasilan job terjadwal harus diperiksa pada halaman **Actions** dan tidak disimpulkan hanya dari commit.
- Pemeriksaan langsung deployment GitHub Pages/HP Android pengguna belum dilakukan.

## Langkah selanjutnya
Prioritaskan melengkapi kode bagi 97 pangan TKPI yang belum tercatat, satu baris sumber setiap kali; pertahankan tanda konflik CP013 dan 11 anomali makro sampai ada citra sumber asli/errata. Tambahkan data gizi lain hanya bila dapat ditelusuri ke kode, porsi, dan kolom sumber yang sama.
