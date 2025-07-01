# 🚀 Deploy Backend SIPESDA ke Vercel

## 📋 Persiapan

### 1. File yang Sudah Disiapkan:
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `api/index.js` - Entry point untuk serverless functions
- ✅ `db.js` - Database pool untuk serverless
- ✅ `routes/users.js` - Updated untuk async/await

---

## 🌐 Deploy ke Vercel

### 1. Connect Repository
1. Buka [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Root Directory**: `backend` 
4. **Framework Preset**: `Other`

### 2. Build Settings
- **Build Command**: `npm run vercel-build`
- **Output Directory**: *(leave empty)*
- **Install Command**: `npm install`

### 3. Environment Variables
Set di Vercel Dashboard:

```
DB_HOST=your-mysql-host
DB_USER=your-mysql-username  
DB_PASSWORD=your-mysql-password
DB_NAME=sipesda
DB_PORT=3306
NODE_ENV=production
```

### 4. Deploy!
Klik **Deploy** dan tunggu prosesnya selesai.

---

## 🔗 Testing Backend

Setelah deploy, backend akan tersedia di:
- **Base URL**: `https://your-backend.vercel.app`
- **API Health Check**: `https://your-backend.vercel.app/api`

### Test Endpoints:
```bash
# Health check
curl https://your-backend.vercel.app/api

# Test user login (jika sudah ada data)
curl -X POST https://your-backend.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

---

## 🔧 Update Frontend di Netlify

### 1. Update API Base URL
Di frontend yang sudah di Netlify, update file database configuration:

```javascript
// Ganti dari localhost ke Vercel URL
const API_BASE_URL = 'https://your-backend.vercel.app/api';
```

### 2. Rebuild Frontend
Setelah update API URL, rebuild dan redeploy frontend di Netlify.

---

## 🔄 Update CORS

### 1. Dapatkan URL Netlify
Setelah frontend deploy, catat URL Netlify Anda, contoh:
`https://amazing-site-123456.netlify.app`

### 2. Update CORS di backend
Edit file `api/index.js`, ganti:

```javascript
origin: process.env.NODE_ENV === 'production' 
  ? [
      'https://your-actual-netlify-domain.netlify.app', // URL Netlify Anda
      'https://your-actual-netlify-domain.netlify.com'  // Alternative
    ]
  : ['http://localhost:5173', 'http://localhost:3000'],
```

### 3. Redeploy Backend
Push perubahan ke GitHub, Vercel akan auto-deploy.

---

## 📊 Database Setup

### Option 1: PlanetScale (Recommended untuk Vercel)
1. Buat database di [PlanetScale](https://planetscale.com)
2. Dapatkan connection string
3. Set sebagai environment variables

### Option 2: Railway MySQL
1. Buat database di [Railway](https://railway.app)
2. Dapatkan database credentials
3. Set sebagai environment variables

### Option 3: Aiven MySQL
1. Buat database di [Aiven](https://aiven.io)
2. Free tier available
3. Set credentials di Vercel

---

## 🔍 Monitoring & Debugging

### Vercel Functions Tab
- Lihat logs di Vercel dashboard
- Monitor function executions
- Check error rates

### Common Issues:
1. **Database timeout**: Increase timeout di db.js
2. **CORS errors**: Update origin dalam corsOptions
3. **Cold start**: First request might be slow

---

## 📝 Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables set
- [ ] Database connected
- [ ] API endpoints working
- [ ] CORS configured with Netlify domain
- [ ] Frontend updated with new API URL
- [ ] Frontend redeployed to Netlify

---

## 🎯 Final URLs

Setelah selesai:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-backend.vercel.app`
- **API Docs**: `https://your-backend.vercel.app/api`

Perfect! Backend di Vercel + Frontend di Netlify! 🚀 