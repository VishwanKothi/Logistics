# 🚀 Logistics Operations Platform - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Database Setup](#database-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Verification Checklist](#verification-checklist)
7. [Demo Credentials](#demo-credentials)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before starting, ensure you have installed:

### Required Software
- **Node.js** v16+ (includes npm)
  - Download: https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- **PostgreSQL** v12+
  - Download: https://www.postgresql.org/download/
  - Verify: `psql --version`
  - Service should be running on `localhost:5432`

- **Git** (optional, for version control)
  - Download: https://git-scm.com/

### System Requirements
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 2GB for node_modules
- **OS**: Windows, macOS, or Linux
- **Internet**: Required for npm package downloads

---

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```
This installs all required packages including Express, Prisma, and authentication libraries.

**Expected output**: `added XXX packages` (should take 2-5 minutes)

### Step 3: Configure Environment Variables
Create a `.env` file (copy from `.env.example`):

```bash
# On Windows (PowerShell or CMD)
copy .env.example .env

# On macOS/Linux (Terminal)
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL Connection String - UPDATE THIS!
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/logistics_platform?schema=public"

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

**⚠️ Important**: Replace `YOUR_PASSWORD` with your PostgreSQL password!

### Step 4: Verify PostgreSQL Connection
```bash
# Test connection (requires psql to be installed)
psql -U postgres -h localhost -c "SELECT 1;"
```

If you get an error, PostgreSQL might not be running. Start it:

```bash
# Windows (Services app or)
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql prompt:
CREATE DATABASE logistics_platform;
```

Or use a GUI tool like pgAdmin if you prefer.

### Step 2: Generate Prisma Client
```bash
npm run prisma:generate
```

**Output**: `✔ Generated Prisma Client`

### Step 3: Push Schema to Database
```bash
npm run prisma:push
```

**Output**: 
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client
```

### Step 4: Seed Demo Data (Optional but Recommended)
```bash
npm run prisma:seed
```

**Output**:
```
✅ Created users:
   - Admin: admin@example.com
   - Manager: manager@example.com
   - Driver: driver@example.com
   - Customer: customer@example.com
✅ Created warehouses: Central Hub, East Coast
✅ Created sample order and shipment
```

---

## ⚛️ Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd ../frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs React, Tailwind CSS, React Router, Axios, and other packages.

**Expected output**: `added XXX packages`

### Step 3: Configure Environment Variables
```bash
# Copy example file
cp .env.example .env
```

Verify `.env` contains:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

**Note**: Frontend automatically uses port 3000. If you need a different port, add:
```env
PORT=3000
```

### Step 4: Build Tailwind CSS (May happen automatically)
```bash
npm run build
```

This compiles Tailwind CSS and optimizes the frontend.

---

## 🚀 Running the Application

### Option A: Run Backend & Frontend in Separate Terminals (Recommended for Development)

#### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
```

**Expected output**:
```
✓ Express server running on port 5000
✓ Prisma Client connected to database
✓ API endpoints available at http://localhost:5000/api
```

#### Terminal 2: Start Frontend Development Server
```bash
cd frontend
npm start
```

**Expected output**:
```
Compiled successfully!
You can now view the app in the browser at:
  http://localhost:3000
```

### Option B: Run Backend Only (API Server)
```bash
cd backend
npm run dev
```

Use Postman/Thunder Client to test API endpoints at:
```
http://localhost:5000/api
```

### Option C: Production Mode
```bash
# Backend
cd backend
npm start

# Frontend (in separate terminal)
cd frontend
npm run build
npm serve -s build
```

---

## ✅ Verification Checklist

### Backend Health Check
- [ ] Server runs on `http://localhost:5000`
- [ ] Database connection successful
- [ ] Test login endpoint: 
  ```bash
  curl -X POST http://localhost:5000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"password123"}'
  ```

### Frontend Health Check
- [ ] App loads on `http://localhost:3000`
- [ ] Login page displays
- [ ] Can log in with demo credentials
- [ ] Dashboard loads after login
- [ ] Navigation works (Orders, Shipments, Exceptions, Billing)

### Database Check
```bash
# View database in Prisma Studio
cd backend
npx prisma studio
```
Opens at `http://localhost:5555` - browse all data visually

---

## 🔐 Demo Credentials

Use these to test the application:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Manager | manager@example.com | password123 |
| Driver | driver@example.com | password123 |
| Customer | customer@example.com | password123 |

---

## 🎯 Quick Start (5 Minutes)

If you just want to get it running fast:

```bash
# 1. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL password
npm run prisma:push
npm run prisma:seed

# 2. Start backend (Terminal 1)
npm run dev

# 3. Frontend setup (Terminal 2)
cd ../frontend
npm install
npm start

# 4. Open browser
# Navigate to http://localhost:3000
# Login with admin@example.com / password123
```

---

## 📁 Project Structure Reference

```
Logistics/
├── backend/
│   ├── server.js              ← Main server file
│   ├── config/
│   │   ├── database.js        ← Prisma Client setup
│   │   └── config.js          ← Environment config
│   ├── services/              ← Business logic layer
│   ├── controllers/           ← Request handlers
│   ├── routes/                ← API endpoints
│   ├── middleware/            ← Auth, validation
│   ├── prisma/
│   │   ├── schema.prisma      ← Database schema
│   │   └── seed.js            ← Demo data
│   ├── .env                   ← Configuration (CREATE THIS)
│   ├── package.json           ← Dependencies
│   └── PRISMA_SETUP.md        ← Detailed Prisma docs
│
├── frontend/
│   ├── src/
│   │   ├── App.js             ← Main component
│   │   ├── index.js           ← Entry point
│   │   ├── pages/             ← Page components
│   │   ├── components/
│   │   │   ├── common/        ← Reusable UI components
│   │   │   ├── orders/        ← Order features
│   │   │   ├── shipments/     ← Shipment features
│   │   │   ├── exceptions/    ← Exception features
│   │   │   └── billing/       ← Billing features
│   │   ├── services/          ← API clients
│   │   ├── context/           ← State management
│   │   ├── utils/             ← Utility functions
│   │   └── index.css          ← Tailwind CSS
│   ├── public/                ← Static files
│   ├── .env                   ← Configuration
│   ├── package.json           ← Dependencies
│   ├── tailwind.config.js     ← Tailwind setup
│   └── postcss.config.js      ← PostCSS setup
│
├── docs/
│   └── database-schema.sql    ← SQL schema (reference)
│
└── README.md                  ← Project overview
```

---

## 🔧 Common Commands Reference

### Backend Commands
```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Prisma commands
npm run prisma:generate       # Generate Prisma Client
npm run prisma:migrate        # Create migration
npm run prisma:push           # Push schema to DB
npm run prisma:seed           # Seed demo data
npx prisma studio            # Open database GUI (http://localhost:5555)
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (⚠️ one-way operation)
npm eject
```

---

## 🚨 Troubleshooting

### Issue: "Cannot find module" errors after installation
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: PostgreSQL Connection Refused
**Solution**:
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct
3. Verify database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -d logistics_platform`

### Issue: "database does not exist"
**Solution**:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE logistics_platform;"

# Then run
npm run prisma:push
```

### Issue: Port 5000 or 3000 already in use
**Solution**:
```bash
# Find process using port (macOS/Linux)
lsof -i :5000
lsof -i :3000

# Kill process (macOS/Linux)
kill -9 <PID>

# Or change port in .env
PORT=5001  # for backend
```

### Issue: CORS errors in console
**Solution**:
1. Ensure backend is running on http://localhost:5000
2. Check REACT_APP_API_BASE_URL in frontend/.env
3. Verify 'http://localhost:3000' is allowed in CORS config

### Issue: Login fails with "User not found"
**Solution**:
1. Run `npm run prisma:seed` to create demo users
2. Verify you're using correct credentials (see [Demo Credentials](#demo-credentials))
3. Check database has users: Open Prisma Studio: `npx prisma studio`

### Issue: Styles not loading (Tailwind CSS missing)
**Solution**:
```bash
# Rebuild Tailwind
npm run build

# Or restart dev server
npm start
```

---

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** - Look at terminal output for error messages
2. **Verify prerequisites** - Ensure Node.js, PostgreSQL installed
3. **Check configuration** - Verify .env files are correct
4. **Database health** - Open Prisma Studio: `npx prisma studio`
5. **Clear cache** - Delete node_modules, reinstall, restart

---

## ✨ Next Steps After Setup

Once everything is running:

1. ✅ Explore the application in browser
2. ✅ Test login with demo credentials
3. ✅ Try creating an order
4. ✅ Track a shipment
5. ✅ View exceptions
6. ✅ Check billing reports
7. ✅ Customize the code for your needs

---

## 🎓 Learning Resources

- **Prisma Docs**: https://www.prisma.io/docs/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Express.js**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/

---

**You're all set! Happy coding! 🚀**
