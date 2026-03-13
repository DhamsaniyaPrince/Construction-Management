# 🚨 URGENT: Fix "Error 401: invalid_client" Right Now

You're seeing this error because your `.env` files are missing or don't have a valid Google Client ID.

## ⚡ IMMEDIATE FIX (3 Steps)

### Step 1: Get Google Client ID (2 minutes)

1. **Go to Google Cloud Console:**
   - Open: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account (princedhamsaniya84@gmail.com)

2. **Create OAuth Client ID:**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - If asked, select **"Web application"**
   - Fill in:
     - **Name**: Construction Management System
     - **Authorized JavaScript origins**: 
       ```
       http://localhost:5173
       ```
     - **Authorized redirect URIs**: 
       ```
       http://localhost:5173
       ```
   - Click **"CREATE"**

3. **Copy the Client ID:**
   - A popup will show your Client ID
   - It looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **COPY THIS** - you'll need it in Step 2

### Step 2: Update .env Files (1 minute)

I've created the `.env` files for you, but you need to add your actual Client ID.

#### Update `backend/.env`:

1. Open `backend/.env` in VS Code
2. Find this line:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```
3. Replace `your_google_client_id_here` with your actual Client ID from Step 1
4. Example:
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```
5. **Save the file** (Ctrl+S)

#### Update `frontend/.env`:

1. Open `frontend/.env` in VS Code
2. Find this line:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```
3. Replace `your_google_client_id_here` with the **SAME** Client ID (must match backend)
4. Example:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```
5. **Save the file** (Ctrl+S)

### Step 3: Restart Servers (30 seconds)

**IMPORTANT:** You MUST restart both servers after updating `.env` files!

1. **Stop both servers:**
   - Go to the terminals where servers are running
   - Press `Ctrl+C` in each terminal

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend** (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test:**
   - Open: http://localhost:5173
   - Click "Sign in with Google"
   - Should work now! ✅

## ✅ Verification

After updating, verify your setup:

```bash
node verify-google-oauth.js
```

This will check if your Client IDs are set correctly.

## 🐛 Still Not Working?

### Check These:

1. **Client ID Format:**
   - ✅ Correct: `123456789-xxxxx.apps.googleusercontent.com`
   - ❌ Wrong: `"123456789-xxxxx.apps.googleusercontent.com"` (no quotes)
   - ❌ Wrong: `123456789-xxxxx.apps.googleusercontent.com ` (no spaces)

2. **Both Files Match:**
   - `backend/.env` and `frontend/.env` must have the **SAME** Client ID

3. **Servers Restarted:**
   - Environment variables are only loaded when servers start
   - You MUST restart after changing `.env` files

4. **OAuth Consent Screen:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Make sure your email (princedhamsaniya84@gmail.com) is added as a **Test User**
   - If not, click "Test users" → "+ ADD USERS" → Add your email

## 📝 Quick Checklist

- [ ] Google Client ID created in Google Cloud Console
- [ ] `backend/.env` has `GOOGLE_CLIENT_ID=your_actual_client_id` (no quotes, no spaces)
- [ ] `frontend/.env` has `VITE_GOOGLE_CLIENT_ID=your_actual_client_id` (same as backend)
- [ ] Both files use the SAME Client ID
- [ ] Your email added as test user in OAuth consent screen
- [ ] Both servers restarted after updating `.env` files
- [ ] Can access http://localhost:5173

## 🆘 Need More Help?

- **Quick Fix Guide:** See [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)
- **Complete Setup:** See [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)
- **VS Code Setup:** See [VS_CODE_SETUP.md](./VS_CODE_SETUP.md)

---

**Follow these 3 steps and your error will be fixed! 🎉**





