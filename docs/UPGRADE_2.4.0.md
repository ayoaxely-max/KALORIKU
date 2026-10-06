# KaloriKu 2.4.0

## Takaran khusus
- Berat satuan diambil dari porsi makanan yang mencantumkan satuan dan gram (191 catatan katalog memiliki takaran yang dapat dikenali sebelum deduplikasi nama).
- Tidak menganggap semua potong 75 g, semua sendok 15 g, atau ml sama dengan gram.
- Atur takaran menyimpan gram per porsi/sdm/sdt/centong/potong/gelas/butir/buah secara pribadi. Kosong menggunakan takaran katalog bila tersedia; tanpa data konversi diblokir.
- Catatan baru menyimpan berat porsi sebagai snapshot; perubahan takaran tidak menghitung ulang catatan lama.
- Edit catatan foto menggunakan berat porsi sumber, bukan berat yang dikonsumsi; komponen foto baru memiliki ID untuk pencocokan yang stabil.

## Kalkulator resep
Database → Kalkulator resep → pilih bahan dan gram → masukkan berat matang serta jumlah porsi → Simpan.
Minyak/gula/saus dimasukkan sebagai bahan sesuai jumlah yang ikut dimakan. Total energi dijumlah dari bahan; berat matang menentukan konsentrasi per 100 g. Tidak melakukan koreksi kehilangan zat gizi selama memasak. Nutrisi tambahan tidak dianggap nol jika satu bahan belum memiliki angkanya. Resep disimpan di customFoods bersama snapshot bahan dan ikut backup/cloud.

## Sinkronisasi gabungan
Backup JSON lokal → Unduh cloud → tinjau konflik dan pilih perangkat/cloud → Gabungkan → Unggah hasil → Unduh dan gabungkan pada perangkat lain.
- ID identik tidak diduplikasi; berat badan memakai tanggal sebagai kunci.
- Konflik menggunakan satu pilihan sumber untuk seluruh konflik. Foto dan seluruh komponen yang terkait dipilih bersama agar konsisten.
- Air minum per tanggal dipilih, tidak dijumlahkan.
- Takaran pribadi ikut backup, pemulihan JSON, dan cadangan cloud; backup v2–v4 lama tetap didukung.
- Snapshot dibaca dari IndexedDB dengan penjaga revisi lokal. Penerapan menggunakan transaksi tunggal dengan pemeriksaan ulang revisi sebelum penggantian store.
- Guard revisi cloud sebelum upload dan enkripsi AES-GCM tetap digunakan. Penggabungan tidak otomatis mengunggah.

Batasan: penghapusan belum memiliki tombstone lintas perangkat, sehingga data yang dihapus pada satu perangkat dapat muncul kembali dari perangkat lain. Catatan dengan ID berbeda dianggap berbeda, walaupun nama atau waktu sama. Pemulihan JSON lokal tetap mengganti data setelah konfirmasi.

## Validasi
`npm ci && npm test` menjalankan 16 tes katalog/perhitungan/penggabungan serta integrasi DOM + IndexedDB terisolasi (jsdom/fake-indexeddb). Integrasi mencakup takaran, resep, gram/edit, encrypt/decrypt dan unduh mock, konflik air, rollback revisi basi, serta berat dasar catatan foto lama.
`npm run audit`: 2678 catatan, 0 error; 11 anomali makro lama tetap ditandai, tidak diubah dalam pembaruan ini.
Uji browser asli tidak dilakukan: unduhan Chromium gagal di lingkungan kerja. Uji sinkronisasi layanan cloud nyata dan browser HP/laptop tetap perlu dilakukan pengguna; pengujian integrasi cloud memakai respons layanan yang dimock.
