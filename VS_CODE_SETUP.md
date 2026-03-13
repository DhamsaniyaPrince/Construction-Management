# 🚀 VS Code Setup Guide

Complete guide to set up and run this project in Visual Studio Code.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ **VS Code** installed - [Download](https://code.visualstudio.com/)
- ✅ **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- ✅ **MongoDB** (local or Atlas) - [Download](https://www.mongodb.com/try/download/community)
- ✅ **Git** (optional, for version control)

## 🎯 Step-by-Step Setup

### Step 1: Open Project in VS Code

1. Open VS Code
2. Click **File** → **Open Folder**
3. Navigate to: `C:\Users\princ\OneDrive\DOCUMENT\Desktop\projectCursor\Construction-Management-main\Construction-Management-main`
4. Click **Select Folder**

### Step 2: Install Dependencies

#### Install Backend Dependencies

1. Open VS Code **Terminal** (`` Ctrl+` `` or **Terminal** → **New Terminal**)
2. Run:
   ```bash
   cd backend
   npm install
   ```
3. Wait for installation to complete

#### Install Frontend Dependencies

1. In the same terminal (or open a new one), run:
   ```bash
   cd frontend
   npm install
   ```
2. Wait for installation to complete

### Step 3: Configure Environment Variables

#### Create Backend `.env` File

1. In VS Code, right-click on the `backend` folder
2. Select **New File**
3. Name it: `.env` (with the dot at the beginning)
4. Add the following content:

```env
# Database
MONGO_URI=mongodb://localhost:27017/construction-management

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Google OAuth (Optional - see SETUP_GOOGLE_OAUTH.md)
GOOGLE_CLIENT_ID=your_google_client_id_here

# Environment
NODE_ENV=development
```

**Important:**
- Replace `MONGO_URI` with your MongoDB connection string
- Replace `JWT_SECRET` with a secure random string (see below)
- For Google OAuth, see [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Create Frontend `.env` File

1. Right-click on the `frontend` folder
2. Select **New File**
3. Name it: `.env`
4. Add the following content:

```env
# API Base URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth Client ID (Optional - must match backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note:** For Google OAuth setup, see [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)

### Step 4: Set Up MongoDB

#### Option A: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use in `.env`: `MONGO_URI=mongodb://localhost:27017/construction-management`

#### Option B: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Click **Connect** → **Connect your application**
5. Copy the connection string
6. Replace `<password>` with your password
7. Paste in `backend/.env` as `MONGO_URI`

### Step 5: Create Admin User

1. Make sure MongoDB is running and connected
2. In VS Code terminal, run:
   ```bash
   cd backend
   node scripts/createAdmin.js
   ```
3. You should see: `✅ Admin created successfully`

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Change these after first login!**

### Step 6: Run the Application

#### Using VS Code Integrated Terminal

**Terminal 1 - Backend:**
1. Open terminal (`` Ctrl+` ``)
2. Click the **+** button to create a new terminal
3. Run:
   ```bash
   cd backend
   npm run dev
   ```
4. You should see: `Server running on port 5000` and `MongoDB connected`

**Terminal 2 - Frontend:**
1. Click the **+** button again to create another terminal
2. Run:
   ```bash
   cd frontend
   npm run dev
   ```
3. You should see: `Local: http://localhost:5173/`

#### Using VS Code Tasks (Recommended)

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "problemMatcher": [],
      "isBackground": true,
      "runOptions": {
        "runOn": "default"
      }
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/frontend"
      },
      "problemMatcher": [],
      "isBackground": true,
      "runOptions": {
        "runOn": "default"
      }
    },
    {
      "label": "Start All",
      "dependsOn": ["Start Backend", "Start Frontend"],
      "problemMatcher": []
    }
  ]
}
```

Then press `Ctrl+Shift+P` → Type "Tasks: Run Task" → Select "Start All"

### Step 7: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 🔧 VS Code Extensions (Recommended)

Install these extensions for better development experience:

1. **ES7+ React/Redux/React-Native snippets** - React code snippets
2. **Prettier - Code formatter** - Auto-format code
3. **ESLint** - JavaScript linting
4. **MongoDB for VS Code** - MongoDB integration
5. **Thunder Client** or **REST Client** - API testing
6. **GitLens** - Git integration
7. **Auto Rename Tag** - HTML/JSX tag renaming

## 🎨 VS Code Settings (Optional)

Create `.vscode/settings.json` for project-specific settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true
  }
}
```

## 🐛 Common Issues in VS Code

### Terminal Not Showing Output

1. Check if terminal is selected (click on terminal panel)
2. Try creating a new terminal: **Terminal** → **New Terminal**
3. Check if Node.js is in PATH: Run `node --version` in terminal

### .env File Not Recognized

1. Make sure file is named exactly `.env` (with dot)
2. Check if file is in the correct folder (`backend/.env` or `frontend/.env`)
3. Restart VS Code if needed

### Port Already in Use

1. Find process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Kill process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```
2. Or change port in `backend/.env`

### Can't Install Dependencies

1. Check Node.js version: `node --version` (should be v14+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then reinstall

### Google OAuth Not Working

1. See [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)
2. Verify `.env` files have correct Client IDs
3. Restart both servers after updating `.env`

## 📝 Debugging in VS Code

### Debug Backend

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

Press `F5` to start debugging.

## ✅ Quick Checklist

Before running the project, ensure:

- [ ] Node.js installed (`node --version`)
- [ ] MongoDB running (local or Atlas)
- [ ] `backend/.env` file created with correct values
- [ ] `frontend/.env` file created with correct values
- [ ] Dependencies installed (`npm install` in both folders)
- [ ] Admin user created (`node scripts/createAdmin.js`)
- [ ] Backend server running (`npm run dev` in backend)
- [ ] Frontend server running (`npm run dev` in frontend)

## 🚀 Next Steps

1. **Set up Google OAuth** (optional): See [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)
2. **Create your first project** after logging in
3. **Explore the features**: Projects, Materials, Attendance, Equipment, Reports
4. **Customize** the application for your needs

## 📚 Additional Resources

- [Main README](./README.md) - Project overview
- [Google OAuth Setup](./SETUP_GOOGLE_OAUTH.md) - Complete OAuth guide
- [Google OAuth Quick Fix](./GOOGLE_OAUTH_QUICK_FIX.md) - Quick troubleshooting

---

**Happy Coding! 🎉**





