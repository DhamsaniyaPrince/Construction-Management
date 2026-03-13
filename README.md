# 🏗️ Construction Management System

A full-stack MERN application for managing construction projects, materials, attendance, equipment, and daily reports.

## 📋 Prerequisites

Before running this project, make sure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or Atlas) - [Download](https://www.mongodb.com/try/download/community) or [Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** (comes with Node.js)

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

#### Backend Configuration

Create/update `backend/.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
NODE_ENV=development
```

**How to get MongoDB connection string:**

**Option A - Local MongoDB:**
```env
MONGO_URI=mongodb://localhost:27017/construction-management
```

**Option B - MongoDB Atlas (Cloud):**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your password
6. Example: `mongodb+srv://username:password@cluster.mongodb.net/construction-management`

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend Configuration

Create/update `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note:** For Google OAuth setup, see [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md) or [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)

### Step 3: Run the Application

#### Terminal 1 - Start Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected
```

#### Terminal 2 - Start Frontend Server
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 4: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 👤 Creating Your First Admin User

Since registration requires admin privileges, you need to create the first admin user manually:

### Option 1: Using MongoDB Compass or MongoDB Shell

1. Connect to your MongoDB database
2. Navigate to the `users` collection
3. Insert a new document:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "$2b$10$...", // Hashed password (use bcrypt)
  "role": "admin",
  "phone": "1234567890"
}
```

### Option 2: Using a Script (Recommended)


Create `backend/scripts/createAdmin.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      phone: '1234567890'
    });

    console.log('Admin user created:', admin.email);
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
```

Run the script:
```bash
cd backend
node scripts/createAdmin.js
```

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Change these credentials after first login!**

## 📁 Project Structure

```
projectCursor/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth & validation middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── uploads/         # Local file storage
│   ├── server.js        # Express server
│   └── .env            # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── context/     # Context API
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   └── App.jsx      # Main app component
    └── .env            # Frontend environment variables
```

## 🔑 User Roles

- **Admin** - Full access to all features
- **Engineer** - Can manage projects, materials, equipment
- **Contractor** - Can request materials, mark attendance
- **Worker** - Can submit reports, view assigned projects

## 🛠️ Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Google OAuth Setup (Optional but Recommended)

This project supports Google Sign-In for easy authentication. To enable it:

### Quick Setup (5 minutes)
See **[GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md)** for a quick 5-minute setup guide.

### Complete Setup Guide
See **[SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)** for detailed step-by-step instructions.

### Verify Your Setup
Run the verification script:
```bash
node verify-google-oauth.js
```

**Note:** Google OAuth is optional. You can still use email/password authentication without it.

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running (local) or connection string is correct (Atlas)
- Verify `.env` file has correct `MONGO_URI`
- Ensure network access is allowed (for Atlas)

### Port Already in Use
- Change `PORT` in `backend/.env`
- Or kill the process using port 5000

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` in `frontend/.env` matches backend port
- Check CORS settings in `backend/server.js`
- Ensure backend is running

### Google OAuth "Error 401: invalid_client"
- Check if `GOOGLE_CLIENT_ID` is set in `backend/.env`
- Check if `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env`
- Both must use the **same** Client ID from Google Cloud Console
- Restart both servers after updating `.env` files
- See [GOOGLE_OAUTH_QUICK_FIX.md](./GOOGLE_OAUTH_QUICK_FIX.md) for detailed troubleshooting

### Images Not Loading
- Check if `backend/uploads/reports/` directory exists
- Verify static file serving in `backend/server.js`
- Check file permissions

## 📝 API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/materials` - List material requests
- `POST /api/materials` - Request material
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Add equipment
- `GET /api/reports` - List daily reports
- `POST /api/reports` - Submit report with images

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Use `npm start` instead of `npm run dev`
3. Configure proper MongoDB connection
4. Set secure JWT_SECRET

### Frontend
1. Run `npm run build`
2. Serve the `dist/` folder with a web server (nginx, Apache, etc.)
3. Update `VITE_API_URL` to production backend URL

## 📄 License

This project is for educational purposes.

---

**Need Help?** Check the troubleshooting section or review the code comments.

