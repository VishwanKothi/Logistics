const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear all data
  await prisma.notification.deleteMany();
  await prisma.deliveryProof.deleteMany();
  await prisma.exceptionReport.deleteMany();
  await prisma.shipmentStatusHistory.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
  console.log('🗑️  Cleared existing data');

  const pw = await bcrypt.hash('password123', 10);

  // Warehouses
  const warehouseData = [
    { name: 'Mumbai Central Hub', location: '123 Nariman Point', city: 'Mumbai', state: 'Maharashtra', country: 'India', capacity: 5000 },
    { name: 'Delhi Distribution Center', location: '456 Connaught Place', city: 'Delhi', state: 'Delhi', country: 'India', capacity: 8000 },
    { name: 'Bangalore Tech Hub', location: '789 MG Road', city: 'Bangalore', state: 'Karnataka', country: 'India', capacity: 4000 },
  ];
  const warehouses = [];
  for (const w of warehouseData) {
    warehouses.push(await prisma.warehouse.create({ data: w }));
  }

  // Admin
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', password_hash: pw, name: 'Rajesh Kumar', phone: '+91-9000000001', role: 'ADMIN', warehouse_id: null }
  });

  // Customers
  const customers = [];
  for (let i = 1; i <= 3; i++) {
    customers.push(await prisma.user.create({
      data: { email: `customer${i}@example.com`, name: `Customer ${i}`, phone: `+91-910000000${i}`, password_hash: pw, role: 'CUSTOMER', warehouse_id: null }
    }));
  }

  // Warehouse Users
  const warehouseUsers = {};
  for (let i = 0; i < warehouses.length; i++) {
    const wh = warehouses[i];
    const cityShort = wh.city.toLowerCase().replace(/\s+/g, '');
    
    const manager = await prisma.user.create({ data: { email: `manager-${cityShort}@example.com`, password_hash: pw, name: `${wh.city} Manager`, phone: `+91-920000000${i+1}`, role: 'MANAGER', warehouse_id: wh.warehouse_id } });
    const staff = await prisma.user.create({ data: { email: `staff-${cityShort}@example.com`, password_hash: pw, name: `${wh.city} Staff`, phone: `+91-930000000${i+1}`, role: 'WAREHOUSE_STAFF', warehouse_id: wh.warehouse_id } });
    
    const drivers = [];
    for (let j = 1; j <= 2; j++) {
      drivers.push(await prisma.user.create({ data: { email: `driver${j}-${cityShort}@example.com`, password_hash: pw, name: `${wh.city} Driver ${j}`, phone: `+91-94000000${i}${j}`, role: 'DRIVER', warehouse_id: wh.warehouse_id } }));
    }
    const heavyDriver = await prisma.user.create({ data: { email: `heavy-${cityShort}@example.com`, password_hash: pw, name: `${wh.city} Heavy Driver`, phone: `+91-950000000${i+1}`, role: 'DRIVER', warehouse_id: wh.warehouse_id } });

    warehouseUsers[wh.warehouse_id] = { manager, staff, drivers, heavyDriver };
  }

  // Orders
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const originWh = randomItem(warehouses);
    const order = await prisma.order.create({
      data: {
        order_number: `ORD-2026-${String(i).padStart(4, '0')}`,
        user_id: customers[0].user_id,
        sender_name: customers[0].name,
        sender_email: customers[0].email,
        sender_phone: customers[0].phone,
        pickup_address: `123 Pickup St`,
        pickup_city: originWh.city,
        receiver_name: `Receiver ${i}`,
        receiver_email: `receiver${i}@example.com`,
        receiver_phone: `+91-999000000${i}`,
        delivery_address: `456 Delivery Ave`,
        delivery_city: randomItem(warehouses).city,
        origin_warehouse_id: originWh.warehouse_id,
        status: 'CONFIRMED'
      }
    });
    orders.push(order);
  }

  // Shipments
  for (const o of orders) {
    const originWh = warehouses.find(w => w.warehouse_id === o.origin_warehouse_id);
    const destWh = warehouses.find(w => w.city === o.delivery_city);
    
    const statusOpts = ['PENDING_ROUTING', 'ROUTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'AT_ORIGIN_WAREHOUSE', 'TRANSIT_ASSIGNED', 'IN_TRANSIT', 'AT_DEST_WAREHOUSE', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const status = randomItem(statusOpts);
    
    const whUsersOrigin = warehouseUsers[originWh.warehouse_id];
    const whUsersDest = warehouseUsers[destWh.warehouse_id];

    await prisma.shipment.create({
      data: {
        shipment_number: `SHIP-${o.order_number}`,
        order_id: o.order_id,
        origin_warehouse_id: originWh.warehouse_id,
        dest_warehouse_id: destWh.warehouse_id,
        status: status,
        pickup_driver_id: ['PICKUP_ASSIGNED', 'PICKED_UP', 'AT_ORIGIN_WAREHOUSE', 'TRANSIT_ASSIGNED', 'IN_TRANSIT', 'AT_DEST_WAREHOUSE', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? randomItem(whUsersOrigin.drivers).user_id : null,
        heavy_driver_id: ['TRANSIT_ASSIGNED', 'IN_TRANSIT', 'AT_DEST_WAREHOUSE', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? whUsersOrigin.heavyDriver.user_id : null,
        delivery_driver_id: ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status) ? randomItem(whUsersDest.drivers).user_id : null,
        items_count: 1,
        weight_kg: 5.5
      }
    });
  }

  console.log('✅ Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
