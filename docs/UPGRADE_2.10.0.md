# KaloriKu 2.10.0

## Edit resep

Resep dapat dibuka dari kartu makanan atau Kelola makanan sendiri → Edit. Editor memuat nama, bahan, gram bahan, berat matang dan jumlah porsi; bahan dapat ditambah atau dihapus. Pratinjau otomatis menghitung ulang total, per porsi dan per 100 gram. Simpan memperbarui ID resep yang sama, mempertahankan favorit dan tidak mengubah catatan asupan lama. Nilai bahan memakai snapshot resep; hapus dan pilih ulang untuk mengambil data katalog terbaru. Nutrisi opsional yang tidak diketahui pada salah satu bahan tetap kosong. Penyimpanan dibatalkan jika resep asal berubah/dihapus di tab lain. Perubahan resep ikut backup dan sinkronisasi yang sudah tersedia.

## Perbandingan backup

Pratinjau file valid menampilkan tabel tambah, ubah, hapus dan sama berdasarkan ID/tanggal untuk catatan makan, makanan/resep, BB, foto, paket, favorit, air dan takaran. Profil dan target air diberi keterangan. Backup lama tanpa air/target air mempertahankan nilai lokal; daftar opsional lain mengikuti perilaku pemulihan lama. Pemulihan tetap mengganti data, bukan menggabungkan. Guard revisi di dalam transaksi kini juga melindungi pemulihan manual: perubahan lokal sesudah pratinjau membatalkan seluruh transaksi. Penutupan dialog ketika membaca file tidak mengaktifkan pratinjau yang sudah dibatalkan. Guard penggabungan cloud dan aturan tombstone tetap berlaku.

## HP dan aksesibilitas

Profil memiliki ukuran teks standar, 115%, dan 130%, disimpan lokal. Font memakai rem agar seluruh tampilan mengikuti pilihan. Bidang masukan minimal 16px, tombol dan ringkasan minimal 44px, fokus keyboard terlihat, nama makanan dapat membungkus, tombol tutup punya label dan notifikasi memakai aria-live. Formulir mengikuti dynamic/visual viewport dengan scroll, navigasi disembunyikan saat keyboard menyempitkan layar, scroll bertingkat hasil pencarian di HP dihilangkan. Safe area dan tinggi navigasi mengikuti ukuran teks; reduced-motion dihormati. Versi/cache semua aset diperbarui ke 2.10.0.

Validasi: 26 unit test plus integrasi DOM/IndexedDB, termasuk edit resep tanpa duplikasi, riwayat lama tetap, pembatalan edit saat asal berubah, selisih backup, rollback pemulihan manual saat revisi berubah, pembatalan baca file dan simulasi viewport keyboard. Pemeriksaan tampilan Chrome dilakukan setelah publikasi. HP fisik Android/iOS dan keyboard nyata masih perlu diuji pada perangkat pengguna.
