# Logistics Operations Platform

A comprehensive full-stack Logistics Operations Platform built with React, Node.js/Express, and PostgreSQL.

## 📋 Project Overview

This platform provides end-to-end logistics management for order processing, shipment tracking, exception handling, and billing operations. It features:

- **Order Management**: Create and track customer orders with pickup/delivery locations
- **Shipment Tracking**: Real-time tracking of shipments with driver assignment and status updates
- **Exception Handling**: Report and resolve logistics exceptions with severity tracking
- **Billing System**: Automated invoicing and financial reporting capabilities
- **User Management**: Role-based access control for different user types
- **Audit Trail**: Complete history tracking for all transactions

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI library
- **React Router v6** - Client-side routing
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Context API** - State management
- **React Icons** - Icon library
- **date-fns** - Date formatting

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

## 📦 Project Structure

```
Logistics/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI components
│   │   │   ├── orders/         # Order feature components
│   │   │   ├── shipments/      # Shipment feature components
│   │   │   ├── exceptions/     # Exception feature components
│   │   │   └── billing/        # Billing feature components
│   │   ├── pages/              # Page-level components
│   │   ├── services/           # API client services
│   │   ├── context/            # React Context providers
│   │   ├── utils/              # Utility functions
│   │   ├── config/             # Configuration files
│   │   └── App.js              # Main app component
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                     # Express application
│   ├── server.js               # Entry point
│   ├── config/
│   │   ├── database.js         # Database connection
│   │   └── config.js           # Environment variables
│   ├── middleware/             # Express middleware
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── routes/                 # API endpoints
│   ├── utils/                  # Utility functions
│   ├── package.json
│   └── .env.example            # Example env variables
│
└── docs/
    ├── database-schema.sql     # PostgreSQL schema
    └── README.md               # Documentation

```

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ and npm
- PostgreSQL 12+
- Git

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database**
```bash
# Create database
createdb logistics_db

# Run schema
psql logistics_db < ../docs/database-schema.sql
```

5. **Start server**
```bash
npm start
```
Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

4. **Start development server**
```bash
npm start
```
App runs on `http://localhost:3000`

## 📝 Common Components

### UI Components (`components/common/`)

- **Button** - Variants: primary, secondary, success, danger, warning, outline
- **Card** - Container with optional header/footer
- **Input** - Form input with validation and error states
- **Select** - Dropdown menu component
- **Loader** - Spinning loader with full-page option
- **Alert** - Dismissible alerts for success/error/warning/info
- **Modal** - Dialog overlay component
- **Table** - Data table with pagination

### Feature Components

**Orders** (`components/orders/`)
- OrderForm - Create/edit orders
- OrderList - Filterable order listing
- OrderDetail - Detailed order view

**Shipments** (`components/shipments/`)
- ShipmentList - Active shipments tracking
- ShipmentTracker - Shipment status and proofs

**Exceptions** (`components/exceptions/`)
- ExceptionList - Open exceptions with filtering

**Billing** (`components/billing/`)
- BillingList - Invoice management with reporting

## 🔐 Authentication

The platform uses JWT-based authentication:

1. Users login with email and password
2. Backend returns JWT token
3. Token stored in localStorage
4. Included in all API requests via Authorization header
5. Protected routes validate token on the frontend

**Demo Credentials** (for development):
- Email: `admin@example.com`
- Password: `password123`

## 🎨 Styling

Full **Tailwind CSS** implementation with custom extensions:

- Custom color scheme aligned with brand
- Responsive utilities for mobile/tablet/desktop
- Custom animations (slideDown, fadeIn, slideUp)
- Dark mode support ready

## 📡 API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Orders
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order

### Shipments
- `GET /api/shipments` - List active shipments
- `GET /api/shipments/:id` - Get shipment details
- `PATCH /api/shipments/:id/status` - Update status
- `GET /api/shipments/:id/active` - Get active shipments

### Exceptions
- `GET /api/exceptions/open` - List open exceptions
- `POST /api/exceptions` - Report exception
- `PATCH /api/exceptions/:id/resolve` - Resolve exception

### Delivery Proofs
- `POST /api/delivery-proofs` - Upload proof
- `GET /api/delivery-proofs/shipment/:shipmentId` - Get proofs

### Billing
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/weekly-report` - Weekly report

## 🗄️ Database Schema

The PostgreSQL database includes:

- **users** - User accounts with roles
- **orders** - Customer orders
- **shipments** - Shipment tracking
- **warehouses** - Warehouse locations
- **handoffs** - Transfer between warehouses
- **delivery_proofs** - Proof of delivery
- **exception_reports** - Reported issues
- **notifications** - User notifications
- **invoices** - Billing records

Plus status history tables for audit trails.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
```

## 🚢 Docker Setup

*Docker configuration files coming soon*

## 📚 Documentation

- [Database Schema](./docs/database-schema.sql) - Complete database design
- [API Documentation](./docs/API.md) - Detailed API reference
- [Component Guide](./docs/COMPONENTS.md) - Component documentation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for logistics excellence**
