# KaloriKu v1.4 — provenance database

## Sumber makanan
- `data/foods.json`: 1.256 entri lama (termasuk 226 entri bertanda TKPI 2020 yang telah dipadankan pada pengembangan sebelumnya).
- `data/foods-extra.json`: 450 entri tambahan berlabel **Estimasi**, dari dataset komunitas [panjiBytes/indonesian-food-composition-glycemic-index](https://github.com/panjiBytes/indonesian-food-composition-glycemic-index) lisensi MIT.
- **Peringatan**: Dataset komunitas mengandung hasil kompilasi dan imputasi, bukan data TKPI yang diverifikasi ulang satu per satu oleh KaloriKu. Periksa selalu angka pada makanan campuran. Data indeks glikemik tidak diikutsertakan.
- Filter otomatis membuang duplikat nama sederhana, nilai negatif/tidak masuk akal, serta perbedaan energi dan makronutrien yang besar; filter ini tidak membuktikan akurasi data yang lolos.

## Takaran edit
Konversi gram/SDM/centong/potong/gelas hanya pendekatan: 1 SDM ≈ 15 g; 1 centong nasi ≈ 100 g, makanan lain ≈ 70 g; 1 potong ≈ 75 g; 1 gelas ≈ 200 g. Variasi setiap makanan dapat besar. Bila tidak ada berat per porsi, aplikasi hanya mengizinkan jumlah porsi.

## Lisensi dataset tambahan
MIT License — Copyright (c) 2026 panjiBytes.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Penambahan makanan sehari-hari 2.1.0
- `data/foods-daily.json`: 168 makanan tambahan: lauk telur, gorengan, sayur, makanan pokok, jajanan, minuman, buah. Takaran dinyatakan per buah/porsi/butir dengan perkiraan massa.
- Semua nilai penambahan ini berstatus **estimasi**, bukan TKPI tervalidasi. Kalori didekati dari protein, karbohidrat, dan lemak (4/4/9 kkal/g). Jenis minyak, gula, saus, serta ukuran porsi mengubah hasil secara signifikan.
- Alias pencarian memudahkan ejaan umum seperti telor/telur dan mata sapi/ceplok tanpa menggandakan nutrisi yang sama. Hasil AI tetap harus dikonfirmasi sebelum disimpan.
- Database lama dan catatan pengguna tidak diubah.
