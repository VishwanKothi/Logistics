# 🏗️ System Architecture Overview

## 📊 How Everything Connects

```
┌──────────────────────────────────────────────────────────────────────┐
│                          END USER (Browser)                          │
│                     http://localhost:3000                           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                 ┌───────────┴────────────┐
                 │                        │
         ┌───────▼────────┐      ┌────────▼────────┐
         │  React App     │      │  Static Assets  │
         │  (Frontend)    │      │  (HTML, CSS, JS)│
         │  Port 3000     │      │                 │
         └───────┬────────┘      └─────────────────┘
                 │
      ┌──────────┴──────────────────┐
      │   HTTP/HTTPS Requests       │
      │   (Axios Client)            │
      │   BASE_URL:environment      │
      │   http://localhost:5000/api │
      └──────────────────┬──────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼────────────────────────────┐  │
    │   Express.js Server             │  │
    │   Backend API (Port 5000)       │  │
    │                                 │  │  
    │   ┌─────────────────────────┐  │  │
    │   │ Routes & Controllers    │  │  │
    │   │ - /api/users            │  │  │
    │   │ - /api/orders           │  │  │
    │   │ - /api/shipments        │  │  │
    │   │ - /api/exceptions       │  │  │
    │   │ - /api/billing          │  │  │
    │   └────────┬────────────────┘  │  │
    │            │                    │  │
    │   ┌────────▼────────────────┐  │  │
    │   │ Service Layer           │  │  │
    │   │ - userService           │  │  │
    │   │ - orderService          │  │  │
    │   │ - shipmentService       │  │  │
    │   │ - exceptionService      │  │  │
    │   │ - billingService        │  │  │
    │   │ - deliveryProofService  │  │  │
    │   └────────┬────────────────┘  │  │
    │            │                    │  │
    │   ┌────────▼────────────────┐  │  │
    │   │ Prisma ORM              │  │  │
    │   │ (Type-Safe DB Client)   │  │  │
    │   └────────┬────────────────┘  │  │
    └───────────────┬──────────────────┘  │
                    │                      │
         ┌──────────▼──────────┐           │
         │  SQL Queries        │           │
         │  Database Client    │           │
         └──────────┬──────────┘           │
                    │                      │
    ┌───────────────▼──────────────────┐  │
    │   PostgreSQL Database            │  │
    │   (Port 5432)                    │  │
    │                                  │  │
    │  ┌──────────────────────────┐   │  │
    │  │ Tables:                  │   │  │
    │  │ - users                  │   │  │
    │  │ - orders                 │   │  │
    │  │ - shipments              │   │  │
    │  │ - exceptions             │   │  │
    │  │ - invoices               │   │  │
    │  │ - warehouses             │   │  │
    │  │ - delivery_proofs        │   │  │
    │  │ - notifications          │   │  │
    │  │ + status history tables  │   │  │
    │  └──────────────────────────┘   │  │
    └───────────────┬──────────────────┘  │
                    │                      │
                    └──────────────────────┘
                         (TCP/IP)
```

---

## 🔄 Data Flow: Login Example

```
User enters credentials
         │
         ▼
┌─────────────────────┐
│ Frontend (React)    │
│ LoginPage.js        │
└────────┬────────────┘
         │
    POST /api/users/login
    {email, password}
         │
         ▼
┌─────────────────────────────┐
│ Backend (Express)           │
│ userController.login()      │
└────────┬────────────────────┘
         │
    Validate input
         │
         ▼
┌─────────────────────────────┐
│ Service Layer               │
│ userService.authenticateUser│
└────────┬────────────────────┘
         │
    Find user in DB
    Compare password hash
         │
         ▼
┌─────────────────────────────┐
│ Prisma ORM Query            │
│ prisma.user.findUnique()    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ PostgreSQL Database         │
│ SELECT * FROM users...      │
└────────┬────────────────────┘
         │
    Return user data
         │
         ▼
┌─────────────────────────────┐
│ Hash & Compare Passwords    │
│ bcrypt.compare()            │
└────────┬────────────────────┘
         │
    Generate JWT Token
         │
         ▼
┌─────────────────────────────┐
│ Return Response             │
│ {token, user}               │
└────────┬────────────────────┘
         │
    200 OK (JSON)
         │
         ▼
┌──────────────────────────┐
│ Frontend (React)         │
│ Store token in localStorage
│ Store user in context    │
│ Redirect to /dashboard   │
└──────────────────────────┘
```

---

## 🔐 Authentication Flow

```
┌────────────────────────────────────────────────┐
│ User Not Logged In                             │
│ (No token in localStorage)                     │
└────────────────┬─────────────────────────────┘
                 │
         Redirect to /login
                 │
                 ▼
        ┌──────────────────┐
        │  Login Page      │
        │  Username/Pass   │
        └──────┬───────────┘
               │
         Submit form
               │
               ▼
    ┌─────────────────────┐
    │ Request /api/users/ │
    │ login               │
    └──────┬──────────────┘
           │
           ▼
    ┌──────────────────┐
    │  Receive Token   │
    │  & User Info     │
    └──────┬───────────┘
           │
           ▼
    ┌───────────────────────────────┐
    │ Store in localStorage:        │
    │ - token (JWT)                 │
    │ - user (name, email, role)    │
    │ Store in AuthContext:         │
    │ - token                       │
    │ - user                        │
    │ - login()                     │
    │ - logout()                    │
    └──────┬────────────────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ ProtectedRoute       │
    │ Checks token exists? │
    └──────┬────────┬──────┘
           │        │
        YES│        │NO
           │        │
      ✓PASS│        │→ Redirect to /login
           │
           ▼
    ┌────────────────┐
    │   Dashboard    │
    │  (Protected)   │
    └────────────────┘


All subsequent requests:
┌──────────────────────────────────────────┐
│ useEffect(() => {                        │
│   const token = localStorage.getItem...  │
│   headers.Authorization = Bearer ${token}│
│   Make API request with token            │
│ }, [])                                   │
└──────────────────────────────────────────┘
```

---

## 📦 Component Architecture

```
App.js (Main Component)
│
├── Routes
│   ├── / (LoginPage)
│   ├── /dashboard (Dashboard)
│   ├── /orders (OrdersPage)
│   │   └── OrderList → OrderDetail
│   ├── /shipments (ShipmentsPage)
│   │   └── ShipmentList → ShipmentTracker
│   ├── /exceptions (ExceptionsPage)
│   │   └── ExceptionList
│   ├── /billing (BillingPage)
│   │   └── BillingList
│   └── * (NotFoundPage)
│
├── Layout
│   ├── Navbar (Top Navigation)
│   │   ├── App Logo
│   │   ├── User Info
│   │   └── Logout Button
│   │
│   └── Sidebar (Side Navigation)
│       ├── Home
│       ├── Orders
│       ├── Shipments
│       ├── Exceptions
│       └── Billing
│
├── Context Providers
│   └── AuthContext
│       ├── token (JWT)
│       ├── user (User info)
│       ├── login()
│       └── logout()
│
└── Services (API Clients)
    ├── userService
    ├── orderService
    ├── shipmentService
    ├── exceptionService
    ├── deliveryProofService
    └── billingService
```

---

## 🗄️ Database Schema Summary

```
┌──────────────────────────────────────────────────────────────────┐
│ PostgreSQL Database: logistics_platform                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Core Tables                                                     │
│  ├─ users (authentication, roles, profiles)                    │
│  ├─ orders (customer orders, locations, status)                │
│  ├─ shipments (shipment tracking, driver assignment)           │
│  ├─ invoices (billing, invoice management)                     │
│                                                                   │
│  Supporting Tables                                              │
│  ├─ warehouses (warehouse locations and capacity)              │
│  ├─ handoffs (warehouse transfers)                             │
│  ├─ delivery_proofs (proof of delivery)                        │
│  ├─ exception_reports (problem reporting)                      │
│  └─ notifications (user notifications)                         │
│                                                                   │
│  Audit Tables                                                   │
│  ├─ order_status_history (order changes)                       │
│  └─ shipment_status_history (shipment changes)                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

All accessed through **Prisma ORM** for type-safe queries.

---

## 🔀 Request/Response Cycle

```
Client (React)
    │
    │ 1. User Action (button click)
    │   Fetch data / Submit form
    │
    ▼
Service Layer (orderService, shipmentService, etc.)
    │
    │ 2. Create HTTP request
    │   POST /api/orders
    │   With JWT token in header
    │   Content-Type: application/json
    │
    ▼
Axios Interceptor
    │
    │ 3. Add auth token
    │   Authorization: Bearer {token}
    │
    ▼
Express Server (Backend)
    │
    │ 4. Route Handler
    │   POST /api/orders
    │   (Matches route in routes/orderRoutes.js)
    │
    ▼
Middleware Chain
    │
    │ 5. Validate token
    │   Express Validator
    │   Check user permissions
    │
    ▼
Controller
    │
    │ 6. Call Service
    │   orderController.createOrder()
    │   Calls orderService.createOrder()
    │
    ▼
Service (Business Logic)
    │
    │ 7. Call Database
    │   orderService.createOrder()
    │   Calls prisma.order.create()
    │
    ▼
Prisma ORM
    │
    │ 8. Generate SQL
    │   Translate to PostgreSQL
    │   Execute query
    │
    ▼
PostgreSQL Database
    │
    │ 9. Execute SQL
    │   INSERT into orders
    │   Return result
    │
    ▼
Prisma (Parse Result)
    │
    │ 10. Return to Service
    │    Typed response
    │
    ▼
Service (Format Response)
    │
    │ 11. Return to Controller
    │
    ▼
Controller (Build API Response)
    │
    │ 12. res.json({...})
    │    200 OK
    │    Content-Type: application/json
    │
    ▼
Express (Send Response)
    │
    │ 13. HTTP Response
    │    JSON data
    │
    ▼
Axios Response Handler
    │
    │ 14. Parse JSON
    │    Handle success/error
    │
    ▼
Component State Update
    │
    │ 15. setState()
    │    Re-render UI
    │
    ▼
Browser Renders UI
    │
    └─→ User sees result
```

---

## 🌐 Network Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Computer                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Browser (http://localhost:3000)                      │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ Frontend Cache                                 │   │   │
│  │ │ - token (JWT)                                  │   │   │
│  │ │ - user info                                    │   │   │
│  │ │ - component state                              │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                 XML/HTTP                                     │
│                   JSON                                       │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │ Node.js (http://localhost:5000)                      │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ API Cache (if implemented)                     │   │   │
│  │ │ - session tokens                              │   │   │
│  │ │ - frequently requested data                    │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│                  SQL/TCP                                     │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │ PostgreSQL (localhost:5432)                          │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ Connection Pool                                │   │   │
│  │ │ - Max 20 concurrent connections                │   │   │
│  │ │ - Reuses idle connections                      │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏰ Startup Sequence

```
Developer runs:
  npm run dev (backend)
  npm start (frontend)

1. Node.js starts Express server
   ├─ Load environment variables (.env)
   ├─ Initialize Prisma Client
   ├─ Connect to PostgreSQL
   ├─ Setup middleware
   ├─ Register routes
   └─ Listen on port 5000

2. React dev server starts
   ├─ Load environment variables (.env)
   ├─ Compile JSX to JavaScript
   ├─ Bundle CSS (Tailwind)
   ├─ Setup hot reload watcher
   ├─ Start dev server
   └─ Listen on port 3000

3. Browser opens http://localhost:3000
   ├─ Download HTML, CSS, JS
   ├─ Execute JavaScript
   ├─ Render LoginPage
   └─ Wait for user interaction

4. User logs in
   ├─ Submit credentials
   ├─ POST to /api/users/login
   ├─ Receive JWT token
   ├─ Store in localStorage
   ├─ Redirect to /dashboard
   └─ Fetch dashboard data

5. Application ready
   ├─ User can navigate
   ├─ All features functional
   └─ Ready for use
```

---

## 📝 API Endpoint Summary

```
Authentication
  POST   /api/users/register     → Create account
  POST   /api/users/login        → Login (get token)
  GET    /api/users/profile      → Get user info

Orders
  GET    /api/orders             → List orders
  POST   /api/orders             → Create order
  GET    /api/orders/:id         → Get order details
  PUT    /api/orders/:id         → Update order

Shipments
  GET    /api/shipments          → List shipments
  GET    /api/shipments/:id      → Get shipment details
  PATCH  /api/shipments/:id/status → Update status

Exceptions
  GET    /api/exceptions/open    → List open exceptions
  POST   /api/exceptions         → Report exception
  PATCH  /api/exceptions/:id/resolve → Resolve

Delivery Proofs
  POST   /api/delivery-proofs    → Upload proof
  GET    /api/delivery-proofs/shipment/:id → Get proofs

Billing
  GET    /api/billing/invoices   → List invoices
  GET    /api/billing/weekly-report → Get report
```

---

This architecture ensures:
✅ **Separation of Concerns** - Frontend, Backend, Database separate
✅ **Type Safety** - Prisma provides full type checking
✅ **Scalability** - Services handle complex business logic
✅ **Security** - JWT tokens, password hashing, CORS
✅ **Maintainability** - Clear folder structure, reusable components
