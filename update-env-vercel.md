# Panduan Update Environment Variables di Vercel

## 1. Login ke Dashboard Vercel

- Buka https://vercel.com/dashboard
- Login dengan akun yang digunakan untuk deploy proyek

## 2. Pilih Proyek Backend

- Cari proyek `sipesda-rpl` di dashboard

## 3. Buka Settings > Environment Variables

- Klik tab "Settings" pada navigasi atas
- Pilih "Environment Variables" dari menu samping

## 4. Tambahkan Environment Variables Berikut:

```
DB_HOST = switchyard.proxy.rlwy.net
DB_USER = root
DB_PASSWORD = IvKYHCaiEJRWuzYYKbnlHUmzeBWQhFSN
DB_NAME = railway
DB_PORT = 24431
NODE_ENV = production
```

## 5. Redeploy Aplikasi

- Setelah menambahkan environment variables, klik "Save"
- Pergi ke tab "Deployments" 
- Pilih "Redeploy" pada deployment terakhir

## 6. Test Koneksi

Setelah redeployment selesai, coba login dari frontend untuk memastikan database sudah terhubung.

---

Jika masih ada error CORS, tanda bahwa database masih belum terhubung dengan benar. Periksa log deployment di Vercel untuk detail lebih lanjut. 