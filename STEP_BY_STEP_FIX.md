# 🔧 Step-by-Step Fix for "Error 401: invalid_client"

**Current Status:** ❌ Your `.env` files have placeholder values. You need to add your actual Google Client ID.

## 🎯 EXACT STEPS TO FIX (Follow in Order)

### STEP 1: Get Your Google Client ID (5 minutes)

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Sign in with: **princedhamsaniya84@gmail.com**

2. **Select or Create a Project:**
   - If you see a project dropdown, select it
   - If no project exists, click "Select a project" → "New Project"
   - Name it: "Construction Management"
   - Click "Create"

3. **Configure OAuth Consent Screen (First Time Only):**
   - Click "OAuth consent screen" in the left menu
   - Select "External" → Click "CREATE"
   - Fill in:
     - **App name**: Construction Management System
     - **User support email**: princedhamsaniya84@gmail.com
     - **Developer contact**: princedhamsaniya84@gmail.com
   - Click "SAVE AND CONTINUE" through all steps
   - **IMPORTANT:** On "Test users" step:
     - Click "+ ADD USERS"
     - Add: **princedhamsaniya84@gmail.com**
     - Click "ADD"
   - Click "BACK TO DASHBOARD"

4. **Create OAuth Client ID:**
   - Click "Credentials" in the left menu
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: Construction Management System
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5173
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5173
     ```
   - Click "CREATE"

5. **Copy Your Client ID:**
   - A popup will appear with your Client ID
   - It looks like: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
   - **COPY THIS ENTIRE STRING** (you'll need it in Step 2)
   - Keep this window open or save the Client ID somewhere

---

### STEP 2: Update backend/.env File (2 minutes)

1. **Open VS Code**
2. **Open the file:** `backend/.env`
   - If it doesn't exist, create it:
     - Right-click `backend` folder → "New File"
     - Name it: `.env` (with the dot)

3. **Find this line:**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. **Replace it with your actual Client ID:**
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```
   (Use YOUR actual Client ID from Step 1, not this example!)

5. **Make sure the file looks like this:**
   ```env
   MONGO_URI=mongodb://localhost:27017/construction-management
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
   NODE_ENV=development
   ```

6. **Save the file** (Ctrl+S)

---

### STEP 3: Update frontend/.env File (2 minutes)

1. **Open the file:** `frontend/.env`
   - If it doesn't exist, create it:
     - Right-click `frontend` folder → "New File"
     - Name it: `.env` (with the dot)

2. **Find this line:**
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. **Replace it with the SAME Client ID:**
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```
   (Use the EXACT SAME Client ID as in backend/.env!)

4. **Make sure the file looks like this:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
   ```

5. **Save the file** (Ctrl+S)

---

### STEP 4: Verify Your Setup (1 minute)

Run this command in your terminal:

```bash
node verify-google-oauth.js
```

**You should see:**
```
✅ Backend: GOOGLE_CLIENT_ID is set
✅ Frontend: VITE_GOOGLE_CLIENT_ID is set
```

**If you still see ❌:**
- Check that you replaced `your_google_client_id_here` with your actual Client ID
- Make sure there are NO quotes around the Client ID
- Make sure there are NO spaces before or after the `=`

---

### STEP 5: Restart Both Servers (CRITICAL!)

**⚠️ IMPORTANT:** You MUST restart both servers after updating `.env` files!

1. **Stop Backend Server:**
   - Go to the terminal where backend is running
   - Press `Ctrl+C`
   - Wait for it to stop

2. **Stop Frontend Server:**
   - Go to the terminal where frontend is running
   - Press `Ctrl+C`
   - Wait for it to stop

3. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   You should see: `Server running on port 5000` and `MongoDB connected`

4. **Start Frontend** (in a NEW terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   You should see: `Local: http://localhost:5173/`

---

### STEP 6: Test Google Sign-In

1. **Open browser:** http://localhost:5173
2. **Click "Sign in with Google"**
3. **Select your Google account** (princedhamsaniya84@gmail.com)
4. **Click "Continue"**

**✅ SUCCESS:** You should be logged in and redirected to the dashboard!

**❌ If you still see the error:**
- Go back to Step 1 and make sure you created the OAuth Client ID correctly
- Make sure your email is added as a Test User in OAuth consent screen
- Double-check that both `.env` files have the EXACT SAME Client ID
- Make sure you restarted both servers

---

## ✅ Checklist

Before testing, make sure:

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] Your email (princedhamsaniya84@gmail.com) added as Test User
- [ ] OAuth Client ID created with correct redirect URIs
- [ ] Client ID copied from Google Cloud Console
- [ ] `backend/.env` has `GOOGLE_CLIENT_ID=your_actual_client_id` (no quotes, no spaces)
- [ ] `frontend/.env` has `VITE_GOOGLE_CLIENT_ID=your_actual_client_id` (same as backend)
- [ ] Both files use the EXACT SAME Client ID
- [ ] Verification script shows ✅ for both
- [ ] Both servers restarted after updating .env files
- [ ] Backend server running (shows "Server running on port 5000")
- [ ] Frontend server running (shows "Local: http://localhost:5173/")

---

## 🐛 Common Mistakes to Avoid

1. **❌ Using quotes:**
   ```
   GOOGLE_CLIENT_ID="123456789-xxxxx.apps.googleusercontent.com"  ❌ WRONG
   ```
   **✅ Correct:**
   ```
   GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com  ✅ RIGHT
   ```

2. **❌ Adding spaces:**
   ```
   GOOGLE_CLIENT_ID = 123456789-xxxxx.apps.googleusercontent.com  ❌ WRONG
   ```
   **✅ Correct:**
   ```
   GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com  ✅ RIGHT
   ```

3. **❌ Different Client IDs:**
   - Backend has: `123456789-xxxxx.apps.googleusercontent.com`
   - Frontend has: `987654321-yyyyy.apps.googleusercontent.com`  ❌ WRONG
   - **They must be the SAME!**

4. **❌ Not restarting servers:**
   - Environment variables are only loaded when servers start
   - You MUST restart after changing .env files

5. **❌ Using Client Secret instead of Client ID:**
   - Use the **Client ID** (long string ending in `.apps.googleusercontent.com`)
   - NOT the Client Secret

---

## 🆘 Still Not Working?

If you've followed all steps and still get the error:

1. **Run verification again:**
   ```bash
   node verify-google-oauth.js
   ```

2. **Check browser console (F12):**
   - Look for error messages
   - Check Network tab for failed requests

3. **Check backend terminal:**
   - Look for "Google auth error" messages
   - Check if MongoDB is connected

4. **Double-check Google Cloud Console:**
   - Make sure OAuth Client ID is created
   - Make sure redirect URIs are: `http://localhost:5173`
   - Make sure your email is in Test Users

---

**Follow these steps exactly and your error will be fixed! 🎉**




