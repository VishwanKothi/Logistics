# Prisma Setup Guide

This project uses **Prisma ORM** for type-safe database interactions with PostgreSQL.

## 📋 What is Prisma?

Prisma is a next-generation ORM that provides:
- **Type Safety** - Auto-generated TypeScript types
- **Auto Migrations** - Manage schema changes with migrations
- **Intuitive API** - Simple, readable queries
- **Type Hints** - Full IDE autocomplete support
- **Query Optimization** - Efficient database queries

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Database URL
Update your `.env` file with the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/logistics_platform?schema=public"
```

Replace:
- `USER` - Your PostgreSQL username (default: `postgres`)
- `PASSWORD` - Your PostgreSQL password
- `localhost:5432` - Your database host and port
- `logistics_platform` - Your database name

### 3. Generate Prisma Client
This creates the type-safe database client:

```bash
npm run prisma:generate
```

### 4. Create Database Tables
Push the schema to your database:

```bash
npm run prisma:push
```

Alternatively, use migrations:
```bash
npm run prisma:migrate
```

### 5. Seed Sample Data (Optional)
Populate the database with demo data:

```bash
npm run prisma:seed
```

Demo credentials provided:
- **Email**: admin@example.com
- **Password**: password123

## 📚 Common Prisma Commands

### View Database Schema
```bash
npx prisma studio
# Opens a visual interface at http://localhost:5555
```

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create a Migration
```bash
npm run prisma:migrate
# Prompts for migration name, e.g., "add_new_field"
```

### Push Schema Changes (without migration history)
```bash
npm run prisma:push
```

### Seed Database
```bash
npm run prisma:seed
```

### Reset Database (⚠️ WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

## 🔄 Database Schema

The Prisma schema defines all models. View or edit:
```bash
backend/prisma/schema.prisma
```

### Models Available

#### User
```prisma
model User {
  user_id    Int     @id @default(autoincrement())
  email      String  @unique
  name       String
  role       UserRole
  is_active  Boolean @default(true)
  // ... relations to other models
}
```

#### Order
```prisma
model Order {
  order_id          Int    @id @default(autoincrement())
  order_number      String @unique
  customer_name     String
  customer_email    String
  // ... more fields
  status            OrderStatus
  shipments         Shipment[]
  statusHistory     OrderStatusHistory[]
}
```

#### Shipment
```prisma
model Shipment {
  shipment_id       Int    @id @default(autoincrement())
  shipment_number   String @unique
  order_id          Int
  driver_id         Int?
  status            ShipmentStatus
  current_location  String?
  // ... more fields
}
```

#### And more: ExceptionReport, DeliveryProof, Invoice, Warehouse, etc.

## 💻 Example Usage in Services

### Create a Record
```javascript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    password_hash: hashedPassword,
    role: 'CUSTOMER',
  },
});
```

### Read Records
```javascript
// Get single record
const user = await prisma.user.findUnique({
  where: { user_id: 1 },
});

// Get multiple records
const orders = await prisma.order.findMany({
  where: { status: 'COMPLETED' },
  include: { shipments: true },
  orderBy: { created_at: 'desc' },
});
```

### Update a Record
```javascript
const shipment = await prisma.shipment.update({
  where: { shipment_id: 1 },
  data: {
    status: 'DELIVERED',
    actual_delivery_date: new Date(),
  },
});
```

### Delete a Record
```javascript
await prisma.order.delete({
  where: { order_id: 1 },
});
```

### Complex Queries with Relations
```javascript
const order = await prisma.order.findUnique({
  where: { order_id: 1 },
  include: {
    user: true,           // Include related user
    shipments: {          // Include related shipments
      include: {
        driver: true,     // Include driver info
        deliveryProofs: true,
        statusHistory: true,
      },
    },
  },
});
```

## 🔍 Introspection Mode

If you have an existing database and want to generate Prisma schema:

```bash
npx prisma db pull
```

This introspects your PostgreSQL database and generates the schema.prisma file.

## 🆘 Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and DATABASE_URL is correct.

### Permission Denied
```
Error: permission denied for schema public
```
**Solution**: Verify the PostgreSQL user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE logistics_platform TO postgres;
```

### Type Errors
If you get TypeScript errors about missing types:
```bash
npm run prisma:generate
```

### Foreign Key Constraint Violation
If you can't insert records due to foreign key constraints:
1. Check the related record exists
2. Ensure CASCADE delete rules are correct in schema
3. Verify relationships are properly defined

## 📖 More Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma API Reference](https://www.prisma.io/docs/reference/api-reference)
- [Data Model](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

## 🔐 Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use environment variables** for DATABASE_URL
3. **Enable SSL** for production:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
   ```
4. **Limit query results** - Always use `take` and `skip` for pagination
5. **Validate input** - Sanitize user inputs before queries

## ✅ Next Steps

1. ✅ Configure `.env` with DATABASE_URL
2. ✅ Run `npm install` to install dependencies
3. ✅ Run `npm run prisma:push` to create tables
4. ✅ Run `npm run prisma:seed` to add sample data
5. ✅ Start the server: `npm run dev`

Your database is now ready to use with Prisma ORM!
