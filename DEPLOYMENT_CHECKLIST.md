# Railway Deployment Checklist ✅

## The Problem You Had

```
❌ WRONG: Frontend catching API requests

User Browser
    ↓ Login with admin@countrylab.com
    ↓
Supabase Auth ✅
    ↓
GET /api/v1/users/me
    ↓
Frontend Railway Server ❌
    ↓
Returns: index.html (200 OK but WRONG!)
    ↓
Frontend tries to parse HTML as JSON
    ↓
ERROR: Dashboard won't load
```

## The Solution

```
✅ CORRECT: Frontend points to Backend

User Browser
    ↓ Login with admin@countrylab.com
    ↓
Supabase Auth ✅
    ↓
GET {VITE_API_URL}/api/v1/users/me
    ↓
Backend Railway Server ✅
    ↓
Returns: {"data": {"id": "...", "email": "admin@countrylab.com", ...}}
    ↓
Frontend receives JSON
    ↓
✅ Dashboard loads successfully!
```

---

## 🎯 Quick Fix Steps

### 1. Find Your Backend Railway URL

Go to Railway → Backend Service → Copy the public URL

Example: `https://countrylab-backend-production.up.railway.app`

### 2. Update Frontend Environment Variable

Go to Railway → Frontend Service → Variables → Add:

```
VITE_API_URL=https://countrylab-backend-production.up.railway.app
```

### 3. Redeploy

Railway will auto-redeploy, or manually trigger it.

### 4. Test

Login at: `https://countrylabfrontend-production.up.railway.app/login`

Email: `admin@countrylab.com`  
Password: `Admin@123456`

Should redirect to dashboard! 🎉

---

## 📋 Complete Environment Variables

### Backend Service

```env
DATABASE_URL=postgresql://...
DATABASE_SCHEMA=countrylab_lms
SUPABASE_URL=https://tqsgztpyjetqonfpccdg.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=09f5742f760b47843fa797df536e6f5cbda5c45df0448c436ebcf9eee69363bd
FRONTEND_URL=https://countrylabfrontend-production.up.railway.app
NODE_ENV=production
PORT=3001
```

### Frontend Service

```env
VITE_SUPABASE_URL=https://tqsgztpyjetqonfpccdg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=https://countrylab-backend-production.up.railway.app
```

---

## ✅ How to Verify It's Working

Open browser console (F12) → Network tab:

**Before fix:**
```
GET https://countrylabfrontend-production.up.railway.app/api/v1/users/me
Response: <!DOCTYPE html>... ❌
```

**After fix:**
```
GET https://countrylab-backend-production.up.railway.app/api/v1/users/me
Response: {"data":{"id":"...","email":"admin@countrylab.com",...}} ✅
```

---

## 🎊 That's It!

The code changes are already done. You just need to:

1. Add `VITE_API_URL` environment variable on Railway
2. Set it to your backend URL
3. Redeploy

Dashboard should work! 🚀
