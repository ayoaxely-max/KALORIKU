# KaloriKu 2.5.0

## Penghapusan tersinkron
Catatan makan, makanan sendiri/resep, berat badan, dan foto memiliki penanda penghapusan di kv `v25DeletionStates`. Penanda menyimpan identitas entri, revisi per entri, ID perubahan, status dihapus/dipulihkan, dan waktu informasi. Revisi menentukan urutan; penghapusan menang jika revisi bersamaan agar data lama tidak muncul kembali. Penggabungan mempertahankan penanda untuk perangkat yang lama offline.

`dbDelete` menyimpan penanda dan menghapus data dalam satu transaksi. `dbPut` pada entri yang ditandai dihapus membuat revisi pemulihan baru. Foto dan catatan komponennya dihapus dalam satu transaksi. Pemulihan JSON lama mempertahankan penanda yang sudah diketahui, menandai entri lokal yang diganti, dan menghasilkan revisi pemulihan untuk entri yang sengaja dikembalikan.

Penghapusan sebelum versi ini tidak memiliki penanda, sehingga tidak dapat disimpulkan hanya dari ketiadaan entri. Pembatalan penghapusan tetap memiliki batas waktu 20 detik. Favorit/paket tetap menggunakan aturan gabungan sebelumnya; penghapusan favorit bukan penghapusan catatan makan.

## Konflik per catatan
Unduhan menampilkan satu pilihan perangkat/cloud untuk setiap ID catatan, tanggal berat badan, tanggal air minum, makanan sendiri, takaran makanan, paket, dan pengaturan. Pilihan semua konflik tersedia sebagai pintasan; pilihan individual tetap dapat diubah. Tombol Gabungkan tidak aktif sebelum semua konflik dipilih dan backup lokal dikonfirmasi. Jika data lokal berubah selama pratinjau, pilihan direset untuk tinjauan ulang.

Foto dan semua komponen catatannya menjadi satu konflik, supaya keputusan tidak mencampur foto dari satu perangkat dengan perhitungan dari perangkat lain. Air minum tidak dijumlahkan. Dua catatan dengan ID berbeda tetap dianggap berbeda, walaupun nama atau waktu sama.

## Format backup
Cadangan baru menggunakan versi 5 serta menyertakan `syncDeletions`. Versi aplikasi lama menolak cadangan v5, sehingga tidak diam-diam membuang penanda penghapusan. Semua perangkat perlu diperbarui ke 2.5.0 sebelum sinkronisasi. Backup v2–v4 tetap dapat dibaca oleh aplikasi baru. Penanda tidak dibersihkan otomatis, agar tetap melindungi perangkat offline.

## Backend
Validasi bagian ciphertext sekarang menerima satu pemisah titik IV/ciphertext yang dihasilkan aplikasi. Sebelumnya regex hanya menerima alfabet base64url dan menolak pemisah tersebut, sehingga unggahan aktual gagal. Autentikasi, CORS origin, batas bagian/ukuran, AES-GCM klien, dan penjaga revisi cloud tidak diubah.

## Pengujian
- `npm test`: 22 tes unit/katalog/worker dan integrasi DOM + IndexedDB, termasuk konflik melalui kontrol antarmuka, delete/undo/restore, penanda penghapusan, konsistensi kelompok foto, dan rollback revisi lokal basi.
- Worker diuji dengan SQLite in-memory dan skema SQL asli: origin/token salah, ciphertext dengan pemisah, unggahan tidak lengkap, commit basi, dan unduhan revisi lama.
- `RUN_LIVE_SYNC=1 node tests/live-sync.cjs`: dua penyimpanan terisolasi, akun acak, dan data buatan melalui endpoint cloud produksi; tidak memakai kode pemulihan atau catatan pengguna. Foto/resep/takaran ikut dienkripsi. Uji mencakup konflik berbeda per catatan, penghapusan lintas penyimpanan, pemulihan, penolakan revisi cloud lama, serta simulasi koneksi terputus. Ciphertext akun uji dibersihkan setelah pengujian.
- Pengujian browser nyata menggunakan browser cloud Chrome dan antarmuka aplikasi yang diterbitkan. Dua penyimpanan uji API tidak sama dengan dua perangkat fisik. Pengujian langsung pada HP/laptop pengguna, jaringan perangkat tersebut, dan mode PWA Android/iOS membutuhkan akses ke perangkat pengguna.
