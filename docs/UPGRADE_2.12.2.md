# 2.12.2 — Tiga koreksi hasil audit

1. Nama hasil barcode diikat ke nomor pencarian. Mengedit nomor membatalkan request lama, menghapus nama sementara, dan meminta Cari ulang. Tombol pengisian label juga memeriksa nomor sebelum membuka formulir.
2. Data per porsi dipilih hanya jika keempat nilai kalori/protein/karbohidrat/lemak lengkap dan valid. Jika tidak, gunakan satu set lengkap per 100 g/ml tanpa mencampur basis takaran. Nilai nol eksplisit valid; gizi kosong tidak diasumsikan nol.
3. Rekap Dashboard dan Statistik memakai pemilihan catatan air yang sama: nol eksplisit dihitung, hari tanpa catatan tidak dihitung, tanggal tidak valid/masa depan dan nilai tidak valid tidak dihitung. Catatan 0 dan 500 ml menghasilkan rerata 250 ml di keduanya. Data tersimpan tidak diubah.

Validasi: npm test termasuk regresi ketiga kasus, pilihan basis per porsi vs 100 g, perubahan nomor saat request berlangsung, dan bulan kosong; npm run audit.
