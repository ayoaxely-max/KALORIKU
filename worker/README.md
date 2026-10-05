# KaloriKu AI Worker

Backend serverless untuk analisis foto makanan KaloriKu.

- `GET /health` memeriksa status Worker.
- `POST /analyze` menerima gambar base64 dari KaloriKu dan mengembalikan daftar komponen makanan + estimasi berat.
- `GEMINI_API_KEY` harus disimpan sebagai Cloudflare Worker secret, tidak pernah di repo.
- Origin yang diizinkan: `https://ayoaxely-max.github.io`.

Setelah Worker diklaim ke akun Cloudflare:
```
npx wrangler secret put GEMINI_API_KEY
npx wrangler deploy
```
