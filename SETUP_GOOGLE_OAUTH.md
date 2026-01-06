# Complete Google OAuth Setup Guide

## ⚠️ IMPORTANT: Fixing "Error 401: invalid_client"

This error means your Google Client ID is missing, incorrect, or not properly configured. Follow these steps carefully.

## Step 1: Create/Configure Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select or Create a Project**:
   - If you don't have a project, click "Select a project" → "New Project"
   - Name it: "Construction Management System"
   - Click "Create"

3. **Configure OAuth Consent Screen** (REQUIRED FIRST):
   - Go to: **"APIs & Services" → "OAuth consent screen"**
   - Select **"External"** (for testing/development)
   - Click "CREATE"
   - Fill in the required fields:
     - **App name**: Construction Management System
     - **User support email**: Your email address
     - **Developer contact information**: Your email address
   - Click **"Save and Continue"**
   - **Scopes**: Click "Save and Continue" (no need to add scopes for basic sign-in)
   - **Test users**: 
     - Click "+ ADD USERS"
     - Add your email address (the one you'll use to sign in)
     - Click "Add"
     - Click "Save and Continue"
   - Click "Back to Dashboard"

4. **Create OAuth 2.0 Client ID**:
   - Go to: **"APIs & Services" → "Credentials"**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - If prompted, select **"Web application"** as the application type
   - Fill in:
     - **Name**: Construction Management System Web Client
     - **Authorized JavaScript origins**: 
       ```
       http://localhost:5173
       ```
       (Add this exactly - no trailing slash)
     - **Authorized redirect URIs**: 
       ```
       http://localhost:5173
       ```
       (For Google Identity Services, this is still required)
   - Click **"CREATE"**
   - **IMPORTANT**: A popup will show your Client ID
   - **Copy the Client ID** (format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Save it somewhere safe** - you'll need it for both .env files

## Step 2: Create Environment Files

### Create `backend/.env`:

Create a new file called `.env` in the `backend` folder with this content:

```env
# Database
MONGO_URI=mongodb://localhost:27017/construction-management

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Google OAuth 2.0 Client ID
# Replace 'your_google_client_id_here' with your actual Client ID from Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_here

# Environment
NODE_ENV=development
```

**Replace `your_google_client_id_here` with your actual Client ID** (the one you copied from Google Cloud Console).

### Create `frontend/.env`:

Create a new file called `.env` in the `frontend` folder with this content:

```env
# API Base URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth 2.0 Client ID
# MUST be the SAME Client ID as in backend/.env
# Replace 'your_google_client_id_here' with your actual Client ID from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Replace `your_google_client_id_here` with the SAME Client ID** (must match backend/.env exactly).

### ⚠️ CRITICAL RULES:

- ✅ Use the **SAME Client ID** in both files
- ✅ **No quotes** around the Client ID
- ✅ **No spaces** before or after the equals sign
- ✅ Just paste the Client ID directly: `123456789-xxxxx.apps.googleusercontent.com`
- ✅ Must end with `.apps.googleusercontent.com`


## Step 3: Restart Servers

**You MUST restart both servers after changing .env files:**

1. Stop backend server (Ctrl+C in backend terminal)
2. Stop frontend server (Ctrl+C in frontend terminal)
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`

## Step 4: Verify Setup

Run the verification script:
```bash
node verify-google-oauth.js
```

This will check if your Client IDs are set correctly.

## Step 3: Verify Your Setup

### Check Your .env Files:

1. **Backend `.env`** should have:
   ```env
   GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
   ```
   (Replace with your actual Client ID)

2. **Frontend `.env`** should have:
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
   ```
   (Same Client ID as backend)

3. **Verify format**:
   - ✅ Starts with numbers: `123456789-`
   - ✅ Contains letters/numbers: `abcdefghijklmnop`
   - ✅ Ends with: `.apps.googleusercontent.com`
   - ✅ No quotes, no spaces

## Step 4: Restart Servers

**⚠️ CRITICAL: You MUST restart both servers after creating/updating .env files!**

1. **Stop backend server** (if running):
   - Press `Ctrl+C` in the backend terminal

2. **Stop frontend server** (if running):
   - Press `Ctrl+C` in the frontend terminal

3. **Start backend**:
   ```bash
   cd backend
   npm install  # Only if you haven't already
   npm run dev
   ```

4. **Start frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install  # Only if you haven't already
   npm run dev
   ```

5. **Verify servers are running**:
   - Backend: http://localhost:5000/api/health
   - Frontend: http://localhost:5173

## Step 5: Test Google Sign In

1. Open http://localhost:5173 in your browser
2. Click "Sign in with Google" or "Sign up with Google"
3. You should see the Google sign-in popup
4. Select your Google account (must be the email you added as a test user)
5. You should be redirected back and logged in

## Troubleshooting: Common Issues

### ❌ "Error 401: invalid_client"

**This is the error you're experiencing. Here's how to fix it:**

1. **Check if .env files exist**:
   - `backend/.env` must exist
   - `frontend/.env` must exist
   - If they don't exist, create them (see Step 2)

2. **Check Client ID format**:
   ```bash
   # In backend/.env, it should look like:
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   
   # NOT like this:
   GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"  # ❌ No quotes
   GOOGLE_CLIENT_ID = 123456789-abcdefghijklmnop.apps.googleusercontent.com  # ❌ No spaces
   GOOGLE_CLIENT_ID=your_google_client_id_here  # ❌ Still has placeholder
   ```

3. **Verify Client ID matches Google Cloud Console**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Copy it exactly (no extra spaces or characters)
   - Paste it into both .env files

4. **Restart servers**:
   - Stop both servers (Ctrl+C)
   - Start them again
   - Environment variables are only loaded when servers start

5. **Check console logs**:
   - Backend: Should show "Server running on port 5000"
   - Frontend: Check browser console for any errors
   - Look for: "VITE_GOOGLE_CLIENT_ID is not set" warning

### ❌ "Access blocked: Authorization Error"

**This means your email isn't authorized:**

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Click on "Test users" tab
3. Click "+ ADD USERS"
4. Add your email address (the one you're using to sign in)
5. Click "Add"
6. Try signing in again

### ❌ Google Sign-In Button Doesn't Appear

1. **Check frontend/.env exists**:
   ```bash
   # File should exist at: frontend/.env
   ```

2. **Check VITE_GOOGLE_CLIENT_ID is set**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
   ```

3. **Restart frontend server**:
   - Stop it (Ctrl+C)
   - Start again: `npm run dev`

4. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for: "VITE_GOOGLE_CLIENT_ID is not set" warning
   - If you see this, the .env file isn't being read

### ❌ "Network error" or Backend Connection Failed

1. **Check backend is running**:
   - Visit: http://localhost:5000/api/health
   - Should return: `{"status":"ok","message":"Construction Management API running"}`

2. **Check frontend/.env has API URL**:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Check CORS** (should be configured in backend/server.js)

### ❌ "Invalid Google token" (Backend Error)

1. **Check backend/.env has Client ID**:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   ```

2. **Verify Client ID matches frontend**:
   - Both files must have the SAME Client ID

3. **Check backend logs**:
   - Look for: "Google auth error" in console
   - This will show the exact error

## Quick Checklist:

Use this checklist to ensure everything is set up correctly:

### Google Cloud Console:
- [ ] Project created in Google Cloud Console
- [ ] OAuth consent screen configured (External type)
- [ ] Your email added as test user in "Test users" section
- [ ] OAuth 2.0 Client ID created (Web application type)
- [ ] Authorized JavaScript origins: `http://localhost:5173`
- [ ] Authorized redirect URIs: `http://localhost:5173`
- [ ] Client ID copied (format: `xxxxx-xxxxx.apps.googleusercontent.com`)

### Environment Files:
- [ ] `backend/.env` file exists
- [ ] `backend/.env` has: `GOOGLE_CLIENT_ID=your_actual_client_id` (no quotes, no spaces)
- [ ] `frontend/.env` file exists
- [ ] `frontend/.env` has: `VITE_GOOGLE_CLIENT_ID=your_actual_client_id` (no quotes, no spaces)
- [ ] Both files use the **SAME Client ID**
- [ ] Client ID format is correct (ends with `.apps.googleusercontent.com`)

### Servers:
- [ ] Backend server restarted after creating/updating `.env`
- [ ] Frontend server restarted after creating/updating `.env`
- [ ] Backend running on: http://localhost:5000
- [ ] Frontend running on: http://localhost:5173

### Testing:
- [ ] Can access: http://localhost:5173
- [ ] Google Sign-In button appears
- [ ] Clicking button opens Google sign-in popup
- [ ] Can sign in with test user email
- [ ] Successfully redirected and logged in

## Still Having Issues?

If you've followed all steps and still get "Error 401: invalid_client":

1. **Double-check Client ID**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click on your OAuth 2.0 Client ID
   - Copy the Client ID from there (not Client Secret)
   - Make sure it's exactly the same in both .env files

2. **Verify .env files are in correct locations**:
   - `backend/.env` (not `backend/env` or `backend/.env.txt`)
   - `frontend/.env` (not `frontend/env` or `frontend/.env.txt`)

3. **Check for hidden characters**:
   - Open .env files in a text editor (not Word)
   - Make sure there are no extra spaces or quotes
   - Client ID should be on one line

4. **Restart everything**:
   - Close all terminals
   - Stop all Node processes
   - Start fresh: `cd backend && npm run dev`
   - In new terminal: `cd frontend && npm run dev`

5. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache and cookies for localhost

## Need More Help?

Check the browser console (F12) and backend terminal for specific error messages. The exact error will help identify the issue.

