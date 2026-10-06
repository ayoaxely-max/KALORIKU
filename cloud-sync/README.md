# KaloriKu v2.0 — Sinkronisasi terenkripsi opsional

KaloriKu tetap **offline-first**. Sinkronisasi berlangsung secara **manual** ketika pengguna menekan **Unggah ke cloud** atau **Unduh dari cloud** di menu Profil. Akun **tidak memerlukan email**: identitas akun dan kunci enkripsi diturunkan dari kode pemulihan 32 byte yang dibuat menggunakan kriptografi browser.

## Cara memakai

1. Di HP: Profil → **Buat akun sinkronisasi baru**.
2. **Salin dan simpan kode pemulihan 43 karakter** secara pribadi. Jangan mengunggahnya ke GitHub, chat, atau membagikannya ke orang lain.
3. Tekan **Unggah ke cloud** dan tunggu konfirmasi revisi tersimpan.
4. Di laptop: buka alamat GitHub Pages KaloriKu yang sama → Profil → tempel kode pemulihan → **Hubungkan perangkat ini**.
5. Tekan **Unduh dari cloud**. Periksa ringkasan, backup data lokal di laptop, kemudian konfirmasi pemulihan. Catatan foto, riwayat makan, berat badan, produk sendiri, pengaturan profil, dan air minum ikut disertakan.
6. Jika melakukan perubahan di laptop, unggah ke cloud. Kemudian unduh perubahan pada HP sebelum mengunggah dari HP lagi.

## Perlindungan

- AES-256-GCM digunakan di browser sebelum pengiriman; kunci tidak diserahkan ke Cloudflare.
- Cloudflare D1 menyimpan data yang telah dienkripsi, ID akun turunan hash, hash token autentikasi, dan nomor revisi. Data makanan atau foto tidak dikirim sebagai plaintext ke backend sinkronisasi.
- Semua request diterima hanya dari origin GitHub Pages yang dikonfigurasi. Ini **bukan** pengganti autentikasi: kepemilikan kode pemulihan tetap diperlukan.
- Perubahan cloud memakai kontrol versi optimistik. Jika revisi berubah karena perangkat lain, unggah ditolak.
- **Penggabungan ditinjau pengguna.** Unduh cloud menampilkan gabungan berdasarkan ID (berat badan berdasarkan tanggal), daftar konflik, dan pilihan perangkat ini atau cloud untuk setiap konflik. Tombol pilihan semua konflik dapat dipakai sebagai pintasan. Air minum pada tanggal sama tidak dijumlahkan. Simpan backup JSON lokal, konfirmasi gabungan, lalu unggah hasilnya.
- Resep tersimpan bersama makanan sendiri; takaran pribadi ikut backup dan cloud.
- Penghapusan catatan, makanan sendiri/resep, berat badan, dan foto memakai penanda persisten yang ikut backup/cloud. Foto dihapus bersama komponennya dalam satu transaksi. Batalkan penghapusan menghasilkan revisi penanda baru, sehingga pemulihan dapat ikut disinkronkan.
- Penanda dipertahankan untuk melindungi perangkat yang lama offline. Penghapusan sebelum versi 2.5.0 tidak dapat direkonstruksi. Dua input dengan ID berbeda tetap dianggap dua catatan meskipun nama dan waktu mirip.
- Cadangan baru menggunakan format v5. Perbarui semua perangkat ke versi 2.5.0; versi lama menolak cadangan v5 agar tidak mengabaikan penanda penghapusan. Pemulihan backup v2–v4 masih didukung.
- Revisi lokal diperiksa saat penerapan dalam satu transaksi IndexedDB. Perubahan data selama pratinjau membatalkan penerapan dan memerlukan tinjauan ulang. Pemulihan JSON lokal tetap menggunakan mode penggantian.
- Tidak ada sinkronisasi latar belakang; jangan mengira perubahan di HP langsung terlihat di laptop sebelum menekan sinkronisasi.
- Pengguna dapat memutuskan akun dari perangkat tanpa menghapus data lokal atau menghapus backup terenkripsi dari cloud lewat dua kali konfirmasi.
- Jika kode pemulihan hilang dan tidak ada perangkat yang masih menyimpannya, pihak pengelola tidak dapat membuka cadangan yang sudah terenkripsi.
- Pada saat penulisan, jumlah bagian data dibatasi 120 × 90.000 karakter (sekitar 8 MB data terenkripsi); jika melebihi batas, aplikasi meminta memakai backup JSON lokal.
- Cloudflare Worker AI untuk foto **terpisah** dari Worker sinkronisasi. Foto yang dianalisis AI tetap dikirim ke layanan analisis atas permintaan pengguna, terlepas dari enkripsi cadangan cloud.

## Infrastruktur

- Frontend: GitHub Pages, berkas `v20.js` dengan Web Crypto API.
- Backend sinkronisasi: `cloud-sync/worker.js` → Worker `kaloriku-sync-v2`.
- D1: `kaloriku_sync_v2`; binding Worker bernama `SYNC_DB`.
- API: `/health`, `/sync/init`, `/sync/head`, `/sync/chunk`, `/sync/commit`, `/sync/manifest`, `/sync/read`, `/sync/delete`.
- SQL schema: `cloud-sync/schema.sql`.
- Domain sinkronisasi: `https://kaloriku-sync-v2.ayoaxely.workers.dev`.

**Validasi 2.5.0:** tes unit/integrasi mencakup penghapusan, undo, konflik per catatan, transaksi dan penjaga revisi. Tes layanan cloud nyata tersedia lewat `RUN_LIVE_SYNC=1 node tests/live-sync.cjs`: dua IndexedDB terisolasi memakai akun acak dan data buatan. Pengujian langsung pada HP/laptop pengguna tetap terpisah; jangan hapus backup JSON.

Validasi bagian data di backend menerima satu pemisah IV/ciphertext `.` pada format terenkripsi aplikasi. Autentikasi, origin, batas ukuran, dan pemeriksaan revisi tetap berlaku.
