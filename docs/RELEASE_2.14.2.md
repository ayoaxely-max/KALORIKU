# KaloriKu 2.14.2 — pemulihan draft foto

Foto kamera/galeri JPEG, PNG, dan WebP disimpan ke IndexedDB sebelum kompresi, kemudian diganti dengan hasil kompresi bila berhasil. Format gambar lainnya disimpan setelah konversi berhasil. Draft tidak membuat catatan kalori. Komponen terpilih dan catatan disimpan saat diubah; draft tersedia melalui Lanjutkan di dashboard, termasuk draft tanggal sebelumnya.

Simpan foto saja tidak memerlukan AI atau komponen makanan. Penyelesaian draft memperbarui foto yang sama dan membuat catatan makan dalam satu transaksi. Penutupan menunggu penyimpanan; jika penyimpanan gagal, foto tetap di formulir dengan pesan kegagalan dan opsi unduh foto. Respons AI dari sesi yang telah ditutup tidak mengubah sesi baru.

Tidak dapat mengembalikan foto lama yang hilang sebelum tersimpan. Draft tetap merupakan data lokal: penghapusan data situs dapat menghapusnya. Foto draft termasuk dalam backup foto yang sudah ada.

Validasi: uji unit, DOM/IndexedDB, regresi barcode, transaksi foto, kegagalan AI, kegagalan kompresi, kegagalan penyimpanan, pemulihan byte foto setelah state memori dihapus, dan penyelesaian draft tanpa duplikasi. Kamera fisik Android belum diuji.
