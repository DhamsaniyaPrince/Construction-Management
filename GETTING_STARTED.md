# 🚀 Getting Started - Quick Start Guide

**Welcome!** This guide will help you get the Construction Management System up and running in **5 minutes**.

## ⚡ Quick Start (5 Steps)

### 1️⃣ Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2️⃣ Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB Community Edition
- Start MongoDB service
- Use: `mongodb://localhost:27017/construction-management`

**Option B: MongoDB Atlas (Cloud - Easier)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create free cluster
4. Get connection string
5. Replace `<password>` with your password

### 3️⃣ Create Environment Files

**Create `backend/.env`:**
```env
MONGO_URI=mongodb://localhost:27017/construction-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id_here
NODE_ENV=development
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4️⃣ Create Admin User

```bash
cd backend
node scripts/createAdmin.js
```

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

### 5️⃣ Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 🎉 You're Done!

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000/api

## 🔐 Optional: Google OAuth Setup

Want Google Sign-In? See:
- **[GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)** - 5-minute setup
- **[SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)** - Complete guide

## 📚 Need More Help?

- **VS Code Setup:** See [VS_CODE_SETUP.md](./VS_CODE_SETUP.md)
- **Full Documentation:** See [README.md](./README.md)
- **Troubleshooting:** Check README.md troubleshooting section

## ✅ Checklist

- [ ] Node.js installed
- [ ] MongoDB running
- [ ] Dependencies installed
- [ ] `.env` files created
- [ ] Admin user created
- [ ] Servers running
- [ ] Can access http://localhost:5173

---

**Happy Coding! 🎉**




