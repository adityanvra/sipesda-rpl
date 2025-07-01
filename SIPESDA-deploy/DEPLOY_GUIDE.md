# 📋 SIPESDA Deployment Guide

## 🎯 Overview
Panduan untuk deploy SIPESDA dengan arsitektur:
- **Frontend**: Vercel (React + TypeScript + Vite)
- **Backend**: Railway/Heroku (Node.js + Express + MySQL)

---

## 🚀 Deploy Backend ke Railway

### 1. Persiapkan Backend
```bash
cd backend
```

### 2. Create `railway.toml` (optional)
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
```

### 3. Environment Variables di Railway
```
NODE_ENV=production
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=sipesda
PORT=3000
```

### 4. Deploy ke Railway
1. Connect GitHub repo ke Railway
2. Select folder: `/backend`
3. Set environment variables
4. Deploy!

---

## 🌐 Deploy Frontend ke Vercel

### 1. Persiapkan Frontend
```bash
cd frontend
npm install
npm run build  # Test build locally
```

### 2. Environment Variables di Vercel
```
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

### 3. Deploy ke Vercel
1. Connect GitHub repo ke Vercel
2. Set Root Directory: `frontend`
3. Build Command: `npm run vercel-build`
4. Output Directory: `dist`
5. Set environment variables
6. Deploy!

---

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
npm run dev  # Jalankan dengan nodemon
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Jalankan Vite dev server
```

---

## 📝 Checklist Deployment

### Backend ✅
- [ ] Environment variables configured
- [ ] Database connected
- [ ] CORS configured for frontend domain
- [ ] Routes tested

### Frontend ✅
- [ ] API URL environment variable set
- [ ] Build successful
- [ ] Static files served correctly
- [ ] Routing works (SPA)

---

## 🔗 URLs setelah Deploy
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app
- **Health Check**: https://your-backend.railway.app/

---

## 🛠️ Troubleshooting

### Common Issues:
1. **CORS Error**: Update backend CORS configuration
2. **API Not Found**: Check VITE_API_BASE_URL environment variable
3. **Build Failed**: Check dependencies and build commands
4. **Database Connection**: Verify database credentials

### Debug Commands:
```bash
# Check environment variables
npm run build -- --debug

# Test API connection
curl https://your-backend.vercel.app

# Check frontend build
npm run preview
``` 