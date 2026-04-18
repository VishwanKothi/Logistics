# ⚡ Quick Setup Checklist

## Phase 1: Prerequisites ✓
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] PostgreSQL installed and running (`psql --version`)
- [ ] PostgreSQL service is **running**

---

## Phase 2: Backend Configuration

### 2.1 Navigate & Install
```bash
cd backend
npm install
```
- [ ] No errors during installation
- [ ] `node_modules` folder created

### 2.2 Create & Configure `.env` File
```bash
cp .env.example .env
```
Edit `.env` and update:
```
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/logistics_platform?schema=public"
```
- [ ] `.env` file exists and has your PostgreSQL password
- [ ] JWT_SECRET is set (can be any string)

### 2.3 Create Database
```bash
psql -U postgres -c "CREATE DATABASE logistics_platform;"
```
- [ ] Database created successfully (or already exists)

### 2.4 Setup Prisma & Database
```bash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```
- [ ] `prisma:generate` completed
- [ ] `prisma:push` synced schema
- [ ] `prisma:seed` created demo data

---

## Phase 3: Frontend Configuration

### 3.1 Navigate & Install
```bash
cd ../frontend
npm install
```
- [ ] No errors during installation
- [ ] `node_modules` folder created

### 3.2 Verify `.env` File
```bash
cat .env.example
```
File should contain:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```
- [ ] `.env` file exists with correct API URL

---

## Phase 4: Run the Application

### 4.1 Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Wait for message:
```
✓ Express server running on port 5000
```
- [ ] Backend running on http://localhost:5000
- [ ] No error messages in console

### 4.2 Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```
Wait for message:
```
Compiled successfully!
You can now view the app in the browser at:
  http://localhost:3000
```
- [ ] Frontend running on http://localhost:3000
- [ ] Browser opens automatically
- [ ] No error messages in console

---

## Phase 5: Verification

### 5.1 Test Login
- [ ] Open http://localhost:3000 in browser
- [ ] See login page
- [ ] Login with:
  - Email: `admin@example.com`
  - Password: `password123`
- [ ] Successfully logged in
- [ ] Redirected to dashboard

### 5.2 Test Features
- [ ] Dashboard loads with stats cards
- [ ] Click "View Orders" button
- [ ] Click "Track Shipments" button
- [ ] Click "Handle Exceptions" button
- [ ] Click "View Billing" button
- [ ] Navigation sidebar works
- [ ] Logout button works

### 5.3 Database Check (Optional)
```bash
cd backend
npx prisma studio
```
- [ ] Opens at http://localhost:5555
- [ ] Can see demo data:
  - 4 users
  - 1 order
  - 1 shipment

---

## Demo Credentials

Use these to test:

```
Admin:
  Email: admin@example.com
  Password: password123

Manager:
  Email: manager@example.com
  Password: password123

Driver:
  Email: driver@example.com
  Password: password123

Customer:
  Email: customer@example.com
  Password: password123
```

---

## 🎉 Success Indicators

You'll know everything is working when:

✅ **Backend**
- Server running on port 5000
- No error messages
- Can connect to database

✅ **Frontend**
- App loads on port 3000
- Login page visible
- Can log in successfully
- Dashboard displays
- Styles (Tailwind) apply correctly

✅ **Database**
- Prisma Studio shows data
- Demo users created
- Demo order and shipment exist

---

## 🆘 If Something Goes Wrong

### Backend won't start
1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Run: `npm run prisma:push`
4. Run: `npm run prisma:seed`
5. Restart: `npm run dev`

### Frontend won't start
1. Delete `node_modules` and `package-lock.json`
2. Run: `npm install`
3. Run: `npm start`

### Login fails
1. Run: `npm run prisma:seed`
2. Check demo credentials above
3. Open Prisma Studio: `npx prisma studio`

### Port already in use
1. Change port in `.env` (e.g., PORT=5001)
2. Or kill process using the port
3. Restart the server

---

## 📋 One-Command Quick Start

For experienced developers:

```bash
# Terminal 1: Backend
cd backend && npm install && cp .env.example .env && npm run prisma:push && npm run prisma:seed && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm start
```

Then open http://localhost:3000 and login with admin@example.com / password123

---

**Status: _______________**  
(Mark when complete)

Last updated: April 5, 2026
