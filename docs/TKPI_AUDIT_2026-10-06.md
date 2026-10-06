# Audit dan penambahan TKPI KaloriKu — 6 Oktober 2026

## Ruang lingkup
Audit terarah atas **11** entri dengan selisih besar antara energi tercatat dan energi teoritis dari makronutrien (`4×protein + 4×karbohidrat + 9×lemak`). Ambang pemeriksaan: selisih lebih besar daripada maksimum 30 kkal atau 20% energi. **Ambang bukan kriteria untuk membetulkan angka**: energi pada tabel pangan dapat berasal dari metode berbeda, serat/pangan majemuk, dan sumber yang belum seragam.

Referensi:
- Kementerian Kesehatan RI, *Tabel Komposisi Pangan Indonesia* 2017, [katalog perpustakaan](https://repository.kemkes.go.id/book/777).
- Kementerian Kesehatan RI, *Tabel Komposisi Pangan Indonesia*, edisi 2020, [katalog perpustakaan](https://repository.kemkes.go.id/book/668).
- [Transkripsi tabel TKPI 2017](https://id.scribd.com/document/507074682/Tabel-Komposisi-Pangan-Indonesia-2017-Dikonversi) dipakai untuk **mencocokkan kode dan angka**. Tidak semua entri telah dicocokkan dengan scan PDF asli edisi 2020. Verifikasi di sini berarti **kecocokan transkripsi**, bukan pengujian laboratorium.

## Hasil pembaruan database
- Penambahan **22** pangan baru berdasarkan baris TKPI 2017, masing-masing mempunyai kode pangan dan metadata sumber (`data/foods-tkpi-2017.json`).
- **12** pangan dengan angka yang cocok dengan tabel TKPI 2017 dipromosikan dari label *Estimasi* ke TKPI 2017 (`data/foods-extra.json`).
- **1** pangan, **Oncom**, dicocokkan dengan CP051: karbohidrat per 100 g disesuaikan dari 22 menjadi **22,6 g**; metadata diubah dari estimasi menjadi TKPI 2017 (`data/foods.json`).
- **11** pangan TKPI lama ditambahkan atau dicek kode/rujukan edisi 2017, termasuk 3 anomali (`data/foods.json`).
- Setelah deduplikasi pencarian yang sudah berlaku di aplikasi: **2.656 entri yang ditampilkan** dari **2.671 entri mentah**, terdiri dari **261 TKPI, 1.987 estimasi, 423 konversi porsi TKPI** dalam data mentah.
- Tidak ada data pengguna atau catatan konsumsi yang diubah.

## Entri yang angkanya sesuai tabel 2017, tetapi perlu klarifikasi ilmiah
| Pangan | Kode TKPI | Kalori tertulis | Energi makro teoritis | Tindakan |
| --- | --- | ---: | ---: | --- |
| Tepung kacang kedelai | CP086 | 347 | 449 | Pertahankan cetakan sumber; beri peringatan |
| Beras Siger | BP021 | 344 | 119 | Pertahankan cetakan sumber; beri peringatan |
| Umbi Uwi, segar | BR033 | 120 | 345 | Pertahankan cetakan sumber; beri peringatan |
| Kopi bubuk instant | MP009 | 129 | 194 | Pertahankan cetakan sumber; beri peringatan |
| Teh hijau daun kering | MP016 | 300 | 371 | Pertahankan cetakan sumber; beri peringatan |
| Teh melati daun kering | MP018 | 299 | 364 | Pertahankan cetakan sumber; beri peringatan |

**Penting:** Angka yang sama tercetak dalam transkripsi TKPI 2017; pencocokan ini tidak membuktikan angka tersebut benar secara analitis. Jangan mengganti salah satu zat gizi tanpa mengonfirmasi sumber primer/errata edisi resmi.

## Entri estimasi yang masih harus diverifikasi
| Pangan | Kalori | Energi makro teoritis | Status |
| --- | ---: | ---: | --- |
| Dendeng Daging Sapi | 433 | 301 | Sumber primer independen belum dicocokkan |
| Ikan Bekasang | 138 | 92 | Sumber primer independen belum dicocokkan |
| Ikan tepung mentah | 316 | 389 | Sumber primer independen belum dicocokkan |
| Jagung Sayur (tumis) | 148,9 | 216 | Sumber primer independen belum dicocokkan |
| Tepung Ikan | 316 | 389 | Sumber primer independen belum dicocokkan |

## Aturan data
- **TKPI** = rekaman komposisi yang dapat dipadankan dengan tabel dan kode sumber; `tkpi_code` dan `source_url` / `verification_source_url` ditambahkan jika tersedia.
- **TKPI (konversi)** = nilai porsi hasil perkalian dari data per 100 g; tidak dihitung sebagai pengukuran TKPI baru.
- **Estimasi** = takaran resep, data komunitas, atau pangan/produk tanpa verifikasi individual; tidak boleh otomatis dinaikkan ke TKPI.
- Tabel TKPI menggunakan satuan *per 100 g BDD*, bukan otomatis per 100 g makanan yang dibeli, dan tidak identik dengan satu mangkuk/porsi.
- Serat dalam berbagai tabel tidak selalu menggunakan definisi sama; kolom tambahan serat/natrium belum diimpor secara massal karena memerlukan pemeriksaan item-level dan kesesuaian definisi.

## Uji teknis
- Sintaks berkas JavaScript utama, service worker, dan modul takaran: valid.
- Semua ID JSON unik, kalori dan makronutrien berangka nonnegatif, seluruh file katalog direferensikan cache offline dan dijalankan oleh pemuat aplikasi.
- Peringatan selisih makronutrien masih aktif di kartu pangan.

Rekomendasi lanjutan: cek sumber **2020 asli/errata** untuk enam anomali transkripsi, cocokkan nilai serat dan natrium satu per satu sebelum menambahkannya, dan terus perbanyak TKPI yang relevan untuk porsi makanan Indonesia.
