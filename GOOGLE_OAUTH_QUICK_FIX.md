# 🚨 Quick Fix: Google OAuth "Error 401: invalid_client"

## The Problem
You're seeing: **"Access blocked: Authorization Error - The OAuth client was not found - Error 401: invalid_client"**

This means your Google Client ID is **missing or incorrect** in your `.env` files.

## ⚡ Quick Solution (5 Minutes)

### Step 1: Get Your Google Client ID (2 minutes)

1. Go to: **https://console.cloud.google.com/apis/credentials**
2. If you don't have a Client ID yet:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: Construction Management System
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173`
   - Click **"CREATE"**
3. **Copy the Client ID** (looks like: `123456789-xxxxx.apps.googleusercontent.com`)

### Step 2: Create/Update .env Files (2 minutes)

#### Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/construction-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
NODE_ENV=development
```

**Replace `PASTE_YOUR_CLIENT_ID_HERE` with your actual Client ID from Step 1.**

#### Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
```

**Replace `PASTE_YOUR_CLIENT_ID_HERE` with the SAME Client ID (must match backend).**

### Step 3: Restart Servers (1 minute)

1. **Stop both servers** (Ctrl+C in both terminals)
2. **Start backend**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Start frontend** (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

### Step 4: Test

1. Open: http://localhost:5173
2. Click "Sign in with Google"
3. Should work! ✅

## ✅ Checklist

Before testing, make sure:

- [ ] `backend/.env` file exists
- [ ] `backend/.env` has: `GOOGLE_CLIENT_ID=your_actual_client_id` (no quotes, no spaces)
- [ ] `frontend/.env` file exists
- [ ] `frontend/.env` has: `VITE_GOOGLE_CLIENT_ID=your_actual_client_id` (same as backend)
- [ ] Both servers restarted after creating .env files
- [ ] Client ID format: `xxxxx-xxxxx.apps.googleusercontent.com`

## 🔍 Still Not Working?

### Check Your .env Files:

**Backend `.env` should look like:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**NOT like this:**
```env
GOOGLE_CLIENT_ID="123456789-..."  ❌ No quotes
GOOGLE_CLIENT_ID = 123456789-...  ❌ No spaces
GOOGLE_CLIENT_ID=your_google_client_id_here  ❌ Still placeholder
```

### Verify Client ID:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client ID** (not Client Secret!)
4. Make sure it's exactly the same in both .env files

### Common Mistakes:

- ❌ Using Client Secret instead of Client ID
- ❌ Adding quotes around the Client ID
- ❌ Adding spaces before/after the equals sign
- ❌ Different Client IDs in frontend and backend
- ❌ Forgetting to restart servers after updating .env

## 📚 Full Setup Guide

For complete setup instructions including OAuth consent screen configuration, see: **SETUP_GOOGLE_OAUTH.md**

## 🆘 Need More Help?

1. Check browser console (F12) for errors
2. Check backend terminal for error messages
3. Run verification: `node verify-google-oauth.js`
4. See detailed troubleshooting in: **SETUP_GOOGLE_OAUTH.md**





