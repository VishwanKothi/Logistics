-- Logistics Operations Platform - PostgreSQL Database Schema
-- Created based on SRS and Domain Model

-- Create ENUM types for status fields
CREATE TYPE user_role AS ENUM (
  'SALES_MANAGER',
  'OPS_COORDINATOR',
  'WAREHOUSE_SUPERVISOR',
  'DRIVER',
  'CUSTOMER_SUPPORT',
  'FINANCE_OFFICER',
  'MANAGEMENT'
);

CREATE TYPE order_status AS ENUM (
  'CREATED',
  'CONFIRMED',
  'ASSIGNED',
  'IN_TRANSIT',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE shipment_status AS ENUM (
  'PENDING_PICKUP',
  'PICKED_UP',
  'IN_WAREHOUSE',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'PARTIAL_DELIVERY',
  'CANCELLED'
);

CREATE TYPE exception_type AS ENUM (
  'DELAY',
  'DAMAGE',
  'SHORTAGE',
  'FAILED_DELIVERY',
  'LOST',
  'OTHER'
);

CREATE TYPE notification_type AS ENUM (
  'PICKUP_CONFIRMED',
  'DELIVERY_CONFIRMED',
  'DELAY_ALERT',
  'EXCEPTION_ALERT',
  'DELIVERY_FAILED',
  'STATUS_UPDATE'
);

-- Users Table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses Table
CREATE TABLE warehouses (
  warehouse_id SERIAL PRIMARY KEY,
  warehouse_code VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100),
  zip_code VARCHAR(20),
  storage_capacity INT NOT NULL,
  manager_id INT REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  pickup_address TEXT NOT NULL,
  pickup_city VARCHAR(100) NOT NULL,
  pickup_state VARCHAR(100),
  pickup_country VARCHAR(100),
  pickup_zip VARCHAR(20),
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_state VARCHAR(100),
  delivery_country VARCHAR(100),
  delivery_zip VARCHAR(20),
  status order_status DEFAULT 'CREATED',
  created_by INT NOT NULL REFERENCES users(user_id),
  assigned_to INT REFERENCES users(user_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipments Table
CREATE TABLE shipments (
  shipment_id SERIAL PRIMARY KEY,
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  order_id INT NOT NULL REFERENCES orders(order_id),
  origin_warehouse_id INT REFERENCES warehouses(warehouse_id),
  destination_warehouse_id INT REFERENCES warehouses(warehouse_id),
  current_location VARCHAR(255),
  status shipment_status DEFAULT 'PENDING_PICKUP',
  assigned_driver_id INT REFERENCES users(user_id),
  weight_kg DECIMAL(10, 2),
  dimensions_length DECIMAL(10, 2),
  dimensions_width DECIMAL(10, 2),
  dimensions_height DECIMAL(10, 2),
  items_count INT,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Handoff Records Table (for custody transfers)
CREATE TABLE handoffs (
  handoff_id SERIAL PRIMARY KEY,
  shipment_id INT NOT NULL REFERENCES shipments(shipment_id),
  from_entity VARCHAR(100) NOT NULL, -- 'WAREHOUSE', 'DRIVER', 'CUSTOMER'
  from_entity_id INT,
  to_entity VARCHAR(100) NOT NULL,
  to_entity_id INT,
  from_person_id INT REFERENCES users(user_id),
  to_person_id INT REFERENCES users(user_id),
  transfer_timestamp TIMESTAMP NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Proof Table
CREATE TABLE delivery_proofs (
  proof_id SERIAL PRIMARY KEY,
  shipment_id INT NOT NULL REFERENCES shipments(shipment_id),
  proof_type VARCHAR(50) NOT NULL, -- 'PHOTO', 'SIGNATURE', 'VIDEO'
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(50),
  uploaded_by INT NOT NULL REFERENCES users(user_id),
  upload_timestamp TIMESTAMP NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'PENDING',
  verified_by INT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exception Reports Table
CREATE TABLE exception_reports (
  exception_id SERIAL PRIMARY KEY,
  shipment_id INT NOT NULL REFERENCES shipments(shipment_id),
  exception_type exception_type NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50), -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  reported_by INT NOT NULL REFERENCES users(user_id),
  reported_at TIMESTAMP NOT NULL,
  resolution_notes TEXT,
  resolved_by INT REFERENCES users(user_id),
  resolved_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  notification_id SERIAL PRIMARY KEY,
  shipment_id INT REFERENCES shipments(shipment_id),
  order_id INT REFERENCES orders(order_id),
  notification_type notification_type NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  recipient_email VARCHAR(255),
  message TEXT NOT NULL,
  send_time TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE invoices (
  invoice_id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id INT NOT NULL REFERENCES orders(order_id),
  shipment_ids INT[], -- Array of shipment IDs
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE'
  services JSON, -- JSON array of services with costs
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  issued_date DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by INT REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Status History Table (Audit trail)
CREATE TABLE order_status_history (
  history_id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(order_id),
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by INT NOT NULL REFERENCES users(user_id),
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipment Status History Table (Audit trail)
CREATE TABLE shipment_status_history (
  history_id SERIAL PRIMARY KEY,
  shipment_id INT NOT NULL REFERENCES shipments(shipment_id),
  old_status shipment_status,
  new_status shipment_status NOT NULL,
  changed_by INT NOT NULL REFERENCES users(user_id),
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for better query performance
CREATE INDEX idx_orders_customer ON orders(customer_email, customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_assigned_driver ON shipments(assigned_driver_id);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);

CREATE INDEX idx_handoffs_shipment_id ON handoffs(shipment_id);
CREATE INDEX idx_handoffs_timestamp ON handoffs(transfer_timestamp);

CREATE INDEX idx_delivery_proofs_shipment_id ON delivery_proofs(shipment_id);
CREATE INDEX idx_delivery_proofs_status ON delivery_proofs(verification_status);

CREATE INDEX idx_exceptions_shipment_id ON exception_reports(shipment_id);
CREATE INDEX idx_exceptions_status ON exception_reports(status);
CREATE INDEX idx_exceptions_type ON exception_reports(exception_type);

CREATE INDEX idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX idx_notifications_delivery_status ON notifications(delivery_status);

CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Create Views for common queries
CREATE VIEW active_shipments AS
SELECT 
  s.shipment_id,
  s.shipment_number,
  o.order_number,
  o.customer_name,
  s.status,
  s.assigned_driver_id,
  u.name as driver_name,
  s.estimated_delivery_date,
  s.created_at
FROM shipments s
JOIN orders o ON s.order_id = o.order_id
LEFT JOIN users u ON s.assigned_driver_id = u.user_id
WHERE s.status NOT IN ('DELIVERED', 'FAILED_DELIVERY', 'CANCELLED');

CREATE VIEW pending_deliveries AS
SELECT 
  s.shipment_id,
  s.shipment_number,
  o.customer_name,
  o.delivery_address,
  o.delivery_city,
  s.assigned_driver_id,
  u.name as driver_name,
  s.estimated_delivery_date
FROM shipments s
JOIN orders o ON s.order_id = o.order_id
LEFT JOIN users u ON s.assigned_driver_id = u.user_id
WHERE s.status IN ('OUT_FOR_DELIVERY', 'IN_TRANSIT');

CREATE VIEW open_exceptions AS
SELECT 
  e.exception_id,
  e.shipment_id,
  s.shipment_number,
  o.customer_name,
  e.exception_type,
  e.severity,
  e.description,
  e.reported_at
FROM exception_reports e
JOIN shipments s ON e.shipment_id = s.shipment_id
JOIN orders o ON s.order_id = o.order_id
WHERE e.status = 'OPEN';
