# Pencocokan 97 entri TKPI tanpa kode — 6 Oktober 2026

## Ringkasan
**97/97** entri yang sebelumnya berkode kosong kini dipadankan dengan kode pangan pada salinan tabel TKPI 2020:
- **96** entri mendapatkan kode pangan unik yang sebelumnya belum tercatat pada database.
- **1** entri merupakan alias pangan yang sama: **Beras merah, nasi — AP005** sama dengan entri TKPI **Nasi merah matang (TKPI 2020)** (ID tkpi20_ap005), dan ditandai secara eksplisit `tkpi_alias_of`.
- Terdapat **260** entri bertipe `tkpi` dalam katalog (data asli per 100 g BDD), tetapi hanya **259** kode sumber unik karena alias AP005. **Tidak ada** lagi entri `tkpi` yang kodenya kosong.
- Komposisi kalori, protein, karbohidrat, lemak, berat BDD, dan ID rekaman **tidak diubah** pada langkah pencocokan 97 kode ini.
- Semua 97 baris diberi metadata `verification_scope` bahwa pencocokan baru meliputi **nama-kode**, belum verifikasi seluruh angka gizi item-level.

## Sumber
- Perpustakaan Kementerian Kesehatan: https://repository.kemkes.go.id/book/668 (metadata publikasi TKPI 2020).
- Salinan isi tabel TKPI 2020 yang menyediakan kode dan nama: https://es.scribd.com/document/524165409/TKPI-2020 .
- Kode diperoleh dari tabel/susunan indeks. Salinan daring **bukan bukti bahwa setiap angka gizi sudah diperiksa pada halaman PDF asli atau errata resmi**. Ini khususnya relevan untuk nilai yang sebelumnya dinyatakan anomali.

## Daftar hasil
| No. | Nama pangan di KaloriKu | Kode TKPI 2020 | Status |
|---:|---|---|---|
| 1 | Beras merah, nasi | AP005 | Alias dari Nasi merah matang (TKPI 2020) — tkpi20_ap005 |
| 2 | Jagung muda, rebus | AP010 | Kode/nama cocok; komposisi belum audit baris |
| 3 | Jagung kuning, tepung | AP011 | Kode/nama cocok; komposisi belum audit baris |
| 4 | Jagung kuning pipil, rebus | AP012 | Kode/nama cocok; komposisi belum audit baris |
| 5 | Makaroni, mentah | AP020 | Kode/nama cocok; komposisi belum audit baris |
| 6 | Biskuit | AP029 | Kode/nama cocok; komposisi belum audit baris |
| 7 | Bika ambon | AP035 | Kode/nama cocok; komposisi belum audit baris |
| 8 | Brem | AP039 | Kode/nama cocok; komposisi belum audit baris |
| 9 | Jagung gerontol | AP051 | Kode/nama cocok; komposisi belum audit baris |
| 10 | Lupis ketan | AP079 | Kode/nama cocok; komposisi belum audit baris |
| 11 | Pastel | AP096 | Kode/nama cocok; komposisi belum audit baris |
| 12 | Beras tumbuk merah, mentah | AR013 | Kode/nama cocok; komposisi belum audit baris |
| 13 | Jagung muda, kuning, mentah | AR015 | Kode/nama cocok; komposisi belum audit baris |
| 14 | Jagung kuning pipil, kering, mentah | AR016 | Kode/nama cocok; komposisi belum audit baris |
| 15 | Batatas kelapa, ubi, kukus | BP002 | Kode/nama cocok; komposisi belum audit baris |
| 16 | Batatas tali, ubi, rebus | BP003 | Kode/nama cocok; komposisi belum audit baris |
| 17 | Belitung, talas, kukus | BP004 | Kode/nama cocok; komposisi belum audit baris |
| 18 | Bentul, talas, kukus | BP005 | Kode/nama cocok; komposisi belum audit baris |
| 19 | Ganyong, rebus | BP007 | Kode/nama cocok; komposisi belum audit baris |
| 20 | Getuk goreng | BP028 | Kode/nama cocok; komposisi belum audit baris |
| 21 | Getuk singkong | BP029 | Kode/nama cocok; komposisi belum audit baris |
| 22 | Batatas kelapa, ubi, segar | BR003 | Kode/nama cocok; komposisi belum audit baris |
| 23 | Bentul (Komba), talas, segar | BR006 | Kode/nama cocok; komposisi belum audit baris |
| 24 | Kacang tanah rebus dg kulit | CP011 | Kode/nama cocok; komposisi belum audit baris |
| 25 | Kacang merah, kering | CR026 | Kode/nama cocok; komposisi belum audit baris |
| 26 | Kacang merah, segar | CR027 | Kode/nama cocok; komposisi belum audit baris |
| 27 | Kacang tanah, kering | CR032 | Kode/nama cocok; komposisi belum audit baris |
| 28 | Bayam, kukus | DP001 | Kode/nama cocok; komposisi belum audit baris |
| 29 | Bayam, rebus | DP002 | Kode/nama cocok; komposisi belum audit baris |
| 30 | Kacang panjang, kukus | DP011 | Kode/nama cocok; komposisi belum audit baris |
| 31 | Kacang panjang, rebus | DP012 | Kode/nama cocok; komposisi belum audit baris |
| 32 | Kangkung, kukus | DP013 | Kode/nama cocok; komposisi belum audit baris |
| 33 | Kangkung, rebus | DP014 | Kode/nama cocok; komposisi belum audit baris |
| 34 | Paria putih, kukus | DP015 | Kode/nama cocok; komposisi belum audit baris |
| 35 | Botok lamtoro | DP027 | Kode/nama cocok; komposisi belum audit baris |
| 36 | Gudeg, sayur | DP032 | Kode/nama cocok; komposisi belum audit baris |
| 37 | Gulai pakis | DP033 | Kode/nama cocok; komposisi belum audit baris |
| 38 | Pelecing kangkung | DP044 | Kode/nama cocok; komposisi belum audit baris |
| 39 | Bawang bombay, segar | DR007 | Kode/nama cocok; komposisi belum audit baris |
| 40 | Bayam, segar | DR008 | Kode/nama cocok; komposisi belum audit baris |
| 41 | Bayam merah, segar | DR009 | Kode/nama cocok; komposisi belum audit baris |
| 42 | Bit, segar | DR010 | Kode/nama cocok; komposisi belum audit baris |
| 43 | Genjer, segar | DR084 | Kode/nama cocok; komposisi belum audit baris |
| 44 | Jagung muda / semi, segar | DR085 | Kode/nama cocok; komposisi belum audit baris |
| 45 | Kacang panjang, segar | DR097 | Kode/nama cocok; komposisi belum audit baris |
| 46 | Kangkung, segar | DR100 | Kode/nama cocok; komposisi belum audit baris |
| 47 | Labu air, segar | DR121 | Kode/nama cocok; komposisi belum audit baris |
| 48 | Labu kuning, segar | DR122 | Kode/nama cocok; komposisi belum audit baris |
| 49 | Labu siam, segar | DR123 | Kode/nama cocok; komposisi belum audit baris |
| 50 | Labu waluh, segar | DR124 | Kode/nama cocok; komposisi belum audit baris |
| 51 | Paria putih, segar | DR131 | Kode/nama cocok; komposisi belum audit baris |
| 52 | Petai, segar | DR134 | Kode/nama cocok; komposisi belum audit baris |
| 53 | Getuk pisang | EP003 | Kode/nama cocok; komposisi belum audit baris |
| 54 | Gandaria masak | ER028 | Kode/nama cocok; komposisi belum audit baris |
| 55 | Bebek, daging, goreng | FP003 | Kode/nama cocok; komposisi belum audit baris |
| 56 | Beef burger | FP036 | Kode/nama cocok; komposisi belum audit baris |
| 57 | Beef teriyaki, masakan | FP037 | Kode/nama cocok; komposisi belum audit baris |
| 58 | Beef yakiniku, masakan | FP038 | Kode/nama cocok; komposisi belum audit baris |
| 59 | Brongkos | FP039 | Kode/nama cocok; komposisi belum audit baris |
| 60 | Gulai kambing | FP047 | Kode/nama cocok; komposisi belum audit baris |
| 61 | Kalio ayam, masakan | FP049 | Kode/nama cocok; komposisi belum audit baris |
| 62 | Kalio kikil (tunjang), masakan | FP051 | Kode/nama cocok; komposisi belum audit baris |
| 63 | Bebek (itik), daging, segar | FR012 | Kode/nama cocok; komposisi belum audit baris |
| 64 | Bebek alabio, daging, segar | FR013 | Kode/nama cocok; komposisi belum audit baris |
| 65 | Kambing, daging, segar | FR019 | Kode/nama cocok; komposisi belum audit baris |
| 66 | Ikan asin, kering | GP004 | Kode/nama cocok; komposisi belum audit baris |
| 67 | Ikan bandeng presto, masakan | GP005 | Kode/nama cocok; komposisi belum audit baris |
| 68 | Ikan cakalang asap, mentah | GP008 | Kode/nama cocok; komposisi belum audit baris |
| 69 | Ikan cakalang asin, mentah | GP009 | Kode/nama cocok; komposisi belum audit baris |
| 70 | Ikan teri, kering, mentah | GP042 | Kode/nama cocok; komposisi belum audit baris |
| 71 | Gulai ikan, masakan | GP065 | Kode/nama cocok; komposisi belum audit baris |
| 72 | Gurame asem manis, masakan | GP068 | Kode/nama cocok; komposisi belum audit baris |
| 73 | Pempek adaan, masakan | GP077 | Kode/nama cocok; komposisi belum audit baris |
| 74 | Pempek kapal selam, masakan | GP079 | Kode/nama cocok; komposisi belum audit baris |
| 75 | Pempek tenggiri, masakan | GP083 | Kode/nama cocok; komposisi belum audit baris |
| 76 | Ikan bandeng, segar | GR007 | Kode/nama cocok; komposisi belum audit baris |
| 77 | Ikan bawal, segar | GR012 | Kode/nama cocok; komposisi belum audit baris |
| 78 | Ikan cakalang, segar | GR019 | Kode/nama cocok; komposisi belum audit baris |
| 79 | Ikan ekor kuning, segar | GR024 | Kode/nama cocok; komposisi belum audit baris |
| 80 | Ikan gabus, segar | GR025 | Kode/nama cocok; komposisi belum audit baris |
| 81 | Ikan kakap, segar | GR030 | Kode/nama cocok; komposisi belum audit baris |
| 82 | Ikan layang, segar | GR039 | Kode/nama cocok; komposisi belum audit baris |
| 83 | Ikan lemuru, segar | GR042 | Kode/nama cocok; komposisi belum audit baris |
| 84 | Ikan mas, segar | GR046 | Kode/nama cocok; komposisi belum audit baris |
| 85 | Ikan mujahir, segar | GR048 | Kode/nama cocok; komposisi belum audit baris |
| 86 | Ikan oci, kembung, segar | GR050 | Kode/nama cocok; komposisi belum audit baris |
| 87 | Ikan patin, segar | GR053 | Kode/nama cocok; komposisi belum audit baris |
| 88 | Ikan sarden, segar | GR057 | Kode/nama cocok; komposisi belum audit baris |
| 89 | Ikan teri, segar | GR068 | Kode/nama cocok; komposisi belum audit baris |
| 90 | Ikan tongkol, segar | GR070 | Kode/nama cocok; komposisi belum audit baris |
| 91 | Kalio telur, masakan | HP008 | Kode/nama cocok; komposisi belum audit baris |
| 92 | Gula kelapa | MP006 | Kode/nama cocok; komposisi belum audit baris |
| 93 | Madu | MP010 | Kode/nama cocok; komposisi belum audit baris |
| 94 | Petis ikan | NP006 | Kode/nama cocok; komposisi belum audit baris |
| 95 | Petis udang kering | NP007 | Kode/nama cocok; komposisi belum audit baris |
| 96 | Bawang merah, segar | NR007 | Kode/nama cocok; komposisi belum audit baris |
| 97 | Bawang putih, segar | NR008 | Kode/nama cocok; komposisi belum audit baris |

## Statistik prefix kode
- AP: 11 pangan
- AR: 3 pangan
- BP: 7 pangan
- BR: 2 pangan
- CP: 1 pangan
- CR: 3 pangan
- DP: 11 pangan
- DR: 14 pangan
- EP: 1 pangan
- ER: 1 pangan
- FP: 8 pangan
- FR: 3 pangan
- GP: 10 pangan
- GR: 15 pangan
- HP: 1 pangan
- MP: 2 pangan
- NP: 2 pangan
- NR: 2 pangan

## Pemeriksaan teknis
- Pemeriksaan format kode, nama sumber, dan duplikasi dilakukan pada 97 rekaman.
- Validasi otomatis seluruh 7 berkas katalog melalui `node scripts/audit-foods.cjs`, termasuk relasi porsi terhadap sumber.
- Tidak ada catatan makan pribadi, riwayat, ataupun backup pengguna yang diedit.
- Baris referensi dengan perbedaan jenis/porsi/komposisi tetap perlu diperiksa ulang sebelum diberi label "nilai gizi terverifikasi".

## Catatan penting
Koreksi angka gizi **belum** menjadi bagian dari pencocokan 97 kode. Untuk validasi penuh, perlu membandingkan satu per satu nilai energi, protein, lemak, karbohidrat, BDD, serta sumber/errata TKPI 2020. Sistem mempertahankan angka sebelumnya agar tidak mengganti data berdasarkan nama semata.
