# Audit data gizi — 7 Oktober 2026 (2.10.1)

Audit struktur mencakup 2.678 entri dan 432 konversi porsi. Pemeriksaan visual PDF primer dibatasi pada tujuh baris TKPI yang ditandai pemeriksaan energi–makro. Ini bukan pengesahan seluruh katalog; 1.986 entri tetap berjenis estimasi.

Rujukan: [katalog Kemenkes TKPI 2020](https://repository.kemkes.go.id/book/668), PDF 140 halaman yang ditautkan katalog. URL PDF, SHA-256, nomor halaman, nilai sebelum/sesudah, serta lingkup pemeriksaan disimpan dalam [bukti JSON](NUTRITION_AUDIT_2026-10-07.json). Nomor halaman PDF menghitung sampul; halaman cetak adalah nomor pada buku.

| Kode | Makanan | PDF / cetak | Hasil |
|---|---|---|---|
| CP086 | Tepung kacang kedelai | 33 / 29 | Angka sesuai cetakan; anomali energi–makro dipertahankan |
| BP021 | Beras Siger | 22 / 18 | Angka sesuai cetakan; anomali dipertahankan |
| BR033 | Umbi uwi segar | 21 / 17 | Angka sesuai cetakan; anomali dipertahankan |
| GP039 | Ikan, tepung, mentah | 65 / 61 | Protein 60 → 60,1 g; natrium 320 mg dihapus karena angka itu adalah retinol; BDD 100 → tidak diketahui karena kolom kosong |
| MP009 | Kopi bubuk instant | 73 / 69 | BDD kosong → 100%; angka gizi sesuai cetakan; anomali dipertahankan |
| MP016 | Teh hijau daun kering | 73 / 69 | BDD kosong → 100%; angka gizi sesuai cetakan; anomali dipertahankan |
| MP018 | Teh melati daun kering | 73 / 69 | BDD kosong → 100%; angka gizi sesuai cetakan; anomali dipertahankan |

Pada tujuh baris tersebut, energi, protein, lemak, karbohidrat, serat, natrium, dan BDD diperiksa. Kolom kosong berarti tidak diketahui, bukan nol. Persentase BDD berbeda dari dasar komposisi per 100 g BDD. Tidak ada perubahan kalori berdasarkan rumus 4–4–9 saja: rumus ini merupakan penyaring, bukan pengganti nilai cetak. Audit ini tidak menemukan errata resmi.

Empat entri komunitas tetap memerlukan sumber independen:

- Dendeng Daging Sapi: kandidat FP014 adalah **dendeng mentah** (301 kkal), sedangkan entri komunitas 433 kkal tidak menentukan mentah/matang. Nilai tidak diganti tanpa kepastian identitas.
- Ikan Bekasang: kandidat NP003 (78 kkal) berbeda dari komunitas (138 kkal); resep/identitas belum dikonfirmasi.
- Jagung Sayur (tumis): belum ada sumber primer yang cocok dengan resep tersebut.
- Tepung Ikan: angka menyerupai GP039, tetapi kondisi bahan tidak tercatat. Gunakan entri tepung ikan mentah bila sesuai bahan yang digunakan.

Pemeriksaan konversi menemukan 18 entri porsi kehilangan serat/natrium yang tersedia pada induknya. Sebanyak 36 nilai ditambahkan sebagai induk × pengali porsi, dibulatkan dua desimal. Bukti JSON mencatat semua perubahan. Ini perhitungan turunan, bukan pemeriksaan primer tambahan.

Antarmuka menampilkan catatan audit, membedakan anomali tercetak dari estimasi yang belum sah, dan mengingatkan bahwa bubuk kopi/daun teh kering berbeda dari minuman seduhan. Catatan asupan lama dan resep tersimpan tetap menggunakan snapshot asal; pembaruan katalog berlaku saat memilih makanan untuk catatan baru.

Hasil quality gate: 0 kesalahan struktur/konversi, 11 penanda gizi (7 anomali tercetak, 4 estimasi belum disahkan). Sebanyak 16 peringatan katalog adalah 15 nama setara dan 1 alias kode; angka itu bukan jumlah masalah gizi. Lulus gate tidak membuktikan semua nilai gizi akurat.

Validasi: audit katalog, 26 unit test, dan suite integrasi (termasuk tampilan anomali primer dan escaping catatan sumber).
