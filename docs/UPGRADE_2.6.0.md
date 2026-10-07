# KaloriKu 2.6.0 — pencarian toleran typo

Pencarian mengenali huruf tertukar, hilang, bertambah, dan terganti; kapitalisasi, tanda baca, variasi ejaan, urutan kata, kata tanpa spasi, serta singkatan nasgor/migor/grg/rbs/aym. Contoh: tleur goreng → Telur goreng, nasigoreng/nasgor → Nasi goreng, teme goreng → Tempe goreng.

Hasil tepat mendahului perkiraan. Kata pendek dan angka tidak dikoreksi secara fuzzy. Maksimum satu edit untuk kata 4–6 huruf dan dua edit untuk kata 7 huruf atau lebih. Nama makanan/alias disimpan dalam cache dengan invalidasi saat namanya berubah. Berlaku pada database, tambah asupan, input cepat, pencarian komponen foto, dan bahan resep. Pencarian berjalan lokal/offline tanpa mengirim teks ke server. Tidak mengubah nama atau nilai gizi database dan tidak membaca tulisan dari gambar (OCR).

25 tes unit serta integrasi DOM/IndexedDB lulus, mencakup typo, singkatan, urutan hasil, kata/angka tidak terkait, dan invalidasi cache.
