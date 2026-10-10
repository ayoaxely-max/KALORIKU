# 2.12.4 — Pembatalan formulir berat badan

Tombol × pada formulir berat badan kini type=button dan menutup dialog melalui data-close. Tombol tidak memicu submit, tidak menyimpan isian, dan tetap berfungsi saat kolom wajib kosong. Tombol Simpan tetap menyimpan berat badan.

Perbaikan formulir produk dan penolakan gizi negatif sudah tersedia dari 2.12.3 dan dipertahankan. Pengujian tambahan memeriksa kedua formulir dengan isian valid/kosong, tidak ada perubahan di memori dan IndexedDB setelah pembatalan, serta penyimpanan berat badan eksplisit. npm test dan npm run audit.
