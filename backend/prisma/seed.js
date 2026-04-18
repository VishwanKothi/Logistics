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
  await prisma.handoff.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
  console.log('🗑️  Cleared existing data');

  const pw = await bcrypt.hash('password123', 10);

  // 1. Create Warehouses
  const warehouseData = [
    { name: 'Mumbai Central Hub', location: '123 Nariman Point', city: 'Mumbai', state: 'Maharashtra', country: 'India', capacity: 5000 },
    { name: 'Delhi Distribution Center', location: '456 Connaught Place', city: 'Delhi', state: 'Delhi', country: 'India', capacity: 8000 },
    { name: 'Bangalore Tech Hub', location: '789 MG Road', city: 'Bangalore', state: 'Karnataka', country: 'India', capacity: 4000 },
    { name: 'Chennai Port Hub', location: '321 Marina Beach Rd', city: 'Chennai', state: 'Tamil Nadu', country: 'India', capacity: 6000 },
    { name: 'Kolkata East Hub', location: '654 Park Street', city: 'Kolkata', state: 'West Bengal', country: 'India', capacity: 3500 },
    { name: 'Hyderabad Central', location: '987 HITEC City', city: 'Hyderabad', state: 'Telangana', country: 'India', capacity: 4500 },
  ];
  const warehouses = [];
  for (const w of warehouseData) {
    warehouses.push(await prisma.warehouse.create({ data: w }));
  }
  console.log(`✅ Created ${warehouses.length} warehouses`);

  // 2. Create Admin (no warehouse)
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', password_hash: pw, name: 'Rajesh Kumar', phone: '+91-9000000001', role: 'ADMIN', warehouse_id: null }
  });

  // 3. Create Customers (no warehouse)
  const customerData = [
    { email: 'customer@example.com', name: 'Amit Sharma', phone: '+91-9100000001' },
    { email: 'customer2@example.com', name: 'Priya Singh', phone: '+91-9100000002' },
    { email: 'customer3@example.com', name: 'Vikram Patel', phone: '+91-9100000003' },
    { email: 'customer4@example.com', name: 'Neha Gupta', phone: '+91-9100000004' },
    { email: 'customer5@example.com', name: 'Suresh Reddy', phone: '+91-9100000005' },
  ];
  const customers = [];
  for (const c of customerData) {
    customers.push(await prisma.user.create({
      data: { ...c, password_hash: pw, role: 'CUSTOMER', warehouse_id: null }
    }));
  }

  // 4. Create warehouse-specific users (Manager, Staff, Drivers per warehouse)
  const warehouseUsers = {};
  const allDrivers = [];
  const driverNames = [
    ['Ravi Verma', 'Sunil Yadav', 'Deepak Chauhan'],
    ['Manish Tiwari', 'Arun Joshi', 'Karan Malhotra'],
    ['Sanjay Nair', 'Vinod Pillai', 'Ganesh Iyer'],
    ['Ramesh Murugan', 'Prakash Sundaram', 'Vijay Raja'],
    ['Debashis Das', 'Anirban Roy', 'Soumen Ghosh'],
    ['Venkat Rao', 'Krishna Murthy', 'Mahesh Babu'],
  ];

  for (let i = 0; i < warehouses.length; i++) {
    const wh = warehouses[i];
    const cityShort = wh.city.toLowerCase().replace(/\s+/g, '');

    // Manager
    const manager = await prisma.user.create({
      data: {
        email: `manager-${cityShort}@example.com`, password_hash: pw,
        name: `${['Anita', 'Sunita', 'Kavita', 'Meera', 'Rekha', 'Pooja'][i]} ${['Desai', 'Mehta', 'Jain', 'Iyer', 'Sen', 'Reddy'][i]}`,
        phone: `+91-920000000${i + 1}`, role: 'MANAGER', warehouse_id: wh.warehouse_id
      }
    });

    // Staff
    const staff = await prisma.user.create({
      data: {
        email: `staff-${cityShort}@example.com`, password_hash: pw,
        name: `${['Rohit', 'Mohit', 'Nikhil', 'Anil', 'Rahul', 'Sachin'][i]} ${['Patil', 'Saxena', 'Kumar', 'Pillai', 'Bose', 'Naidu'][i]}`,
        phone: `+91-930000000${i + 1}`, role: 'WAREHOUSE_STAFF', warehouse_id: wh.warehouse_id
      }
    });

    // 3 Drivers per warehouse
    const drivers = [];
    for (let j = 0; j < 3; j++) {
      const driver = await prisma.user.create({
        data: {
          email: `driver${j + 1}-${cityShort}@example.com`, password_hash: pw,
          name: driverNames[i][j],
          phone: `+91-94${i}${j}000000${j + 1}`, role: 'DRIVER', warehouse_id: wh.warehouse_id
        }
      });
      drivers.push(driver);
      allDrivers.push(driver);
    }

    warehouseUsers[wh.warehouse_id] = { manager, staff, drivers };
  }
  console.log(`✅ Created users: 1 admin, ${customers.length} customers, ${warehouses.length} managers, ${warehouses.length} staff, ${allDrivers.length} drivers`);

  // 5. Create Orders (with sender + receiver info)
  const receiverNames = ['Deepak Mehta', 'Sonia Arora', 'Alok Mishra', 'Kavya Nair', 'Tarun Bhatia', 'Divya Kapoor', 'Rajat Sinha', 'Ankita Joshi', 'Manav Pillai', 'Shreya Das'];
  const receiverPhones = ['+91-9800000001', '+91-9800000002', '+91-9800000003', '+91-9800000004', '+91-9800000005', '+91-9800000006', '+91-9800000007', '+91-9800000008', '+91-9800000009', '+91-9800000010'];
  const notesOpts = ['Fragile electronics', 'Temperature-sensitive goods', 'Handle with care', 'Do not bend', 'Heavy machinery parts', null, null];
  const orderStatuses = ['PLACED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const orders = [];
  for (let i = 1; i <= 60; i++) {
    const customer = randomItem(customers);
    const originWh = randomItem(warehouses);
    const destCity = randomItem(warehouses.filter(w => w.warehouse_id !== originWh.warehouse_id));
    const status = randomItem(orderStatuses);
    const recvIdx = randomInt(0, receiverNames.length - 1);

    const order = await prisma.order.create({
      data: {
        order_number: `ORD-2026-${String(i).padStart(4, '0')}`,
        user_id: customer.user_id,
        sender_name: customer.name,
        sender_email: customer.email,
        sender_phone: customer.phone || '+91-9100000000',
        pickup_address: `${randomInt(10, 999)} ${randomItem(['MG Road', 'Station Road', 'Market Street', 'Ring Road', 'Highway Lane'])}`,
        pickup_city: originWh.city,
        pickup_state: originWh.state,
        receiver_name: receiverNames[recvIdx],
        receiver_email: `${receiverNames[recvIdx].toLowerCase().replace(' ', '.')}@email.com`,
        receiver_phone: receiverPhones[recvIdx],
        delivery_address: `${randomInt(10, 999)} ${randomItem(['Gandhi Nagar', 'Nehru Colony', 'Sector 12', 'Civil Lines', 'Lake View Rd'])}`,
        delivery_city: destCity.city,
        delivery_state: destCity.state,
        origin_warehouse_id: originWh.warehouse_id,
        status,
        notes: randomItem(notesOpts),
      }
    });
    orders.push(order);
  }
  console.log(`✅ Created ${orders.length} orders`);

  // 6. Create Shipments for non-cancelled/placed orders
  const shipmentStatuses = ['PENDING_PICKUP', 'PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'];
  const activeOrders = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'PLACED');
  const shipments = [];
  const histories = [];
  const handoffs = [];
  const exceptions = [];
  const proofs = [];

  for (let i = 0; i < activeOrders.length; i++) {
    const o = activeOrders[i];
    const status = randomItem(shipmentStatuses);
    const originWh = warehouses.find(w => w.warehouse_id === o.origin_warehouse_id);
    const whUsers = warehouseUsers[originWh.warehouse_id];
    const assignedDriver = status !== 'PENDING_PICKUP' ? randomItem(whUsers.drivers) : null;

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - randomInt(1, 15));
    const estDelivery = new Date(createdDate);
    estDelivery.setDate(estDelivery.getDate() + randomInt(3, 10));
    let actDelivery = null;
    if (status === 'DELIVERED') {
      actDelivery = new Date(estDelivery);
      actDelivery.setDate(actDelivery.getDate() - randomInt(0, 2));
    }

    // Determine warehouse tracking based on status
    let currentWarehouseId = null;
    let nextStopWarehouseId = null;
    let isFinalDelivery = false;

    if (['ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED'].includes(status)) {
      currentWarehouseId = originWh.warehouse_id;
    }
    if (status === 'ROUTED') {
      // Randomly decide: go to another warehouse or final delivery
      if (Math.random() > 0.5) {
        const destWh = randomItem(warehouses.filter(w => w.warehouse_id !== originWh.warehouse_id));
        nextStopWarehouseId = destWh.warehouse_id;
      } else {
        isFinalDelivery = true;
      }
    }
    if (status === 'OUT_FOR_DELIVERY') {
      isFinalDelivery = true;
    }

    const ship = await prisma.shipment.create({
      data: {
        shipment_number: `SHIP-2026-${String(i + 1).padStart(4, '0')}`,
        order_id: o.order_id,
        driver_id: assignedDriver?.user_id || null,
        weight_kg: randomInt(1, 100) + Math.random(),
        items_count: randomInt(1, 15),
        current_location: originWh.city,
        current_warehouse_id: currentWarehouseId,
        next_stop_warehouse_id: nextStopWarehouseId,
        is_final_delivery: isFinalDelivery,
        status,
        estimated_delivery_date: estDelivery,
        actual_delivery_date: actDelivery,
        created_at: createdDate,
      }
    });

    // Status history
    if (status !== 'PENDING_PICKUP') {
      histories.push({ shipment_id: ship.shipment_id, old_status: 'PENDING_PICKUP', new_status: 'PICKED_UP' });
    }
    if (['ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'].includes(status)) {
      histories.push({ shipment_id: ship.shipment_id, old_status: 'PICKED_UP', new_status: 'ARRIVED_AT_WAREHOUSE' });
    }
    if (['IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      histories.push({ shipment_id: ship.shipment_id, old_status: 'ARRIVED_AT_WAREHOUSE', new_status: 'IN_WAREHOUSE' });
    }
    if (status === 'DELIVERED' && assignedDriver) {
      proofs.push({
        shipment_id: ship.shipment_id,
        uploaded_by_id: assignedDriver.user_id,
        proof_type: randomItem(['PHOTO', 'SIGNATURE']),
        file_url: `/uploads/proof_mock_${randomInt(100, 999)}.jpg`,
        verification_status: randomItem(['PENDING', 'VERIFIED', 'VERIFIED']),
        verified_at: actDelivery,
      });
    }

    // Occasional exceptions
    if (Math.random() > 0.85) {
      const reporter = randomItem([...whUsers.drivers, whUsers.staff]);
      exceptions.push({
        shipment_id: ship.shipment_id,
        reported_by_id: reporter.user_id,
        exception_type: randomItem(['DELAYED', 'LOST', 'DAMAGED', 'WRONG_ADDRESS', 'WEATHER_DELAY', 'VEHICLE_BREAKDOWN']),
        severity: randomItem(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
        description: randomItem(['Heavy rain causing delay.', 'Package damaged during transit.', 'Incorrect address provided by sender.', 'Vehicle breakdown on highway.', 'Recipient not available at delivery address.']),
        is_resolved: Math.random() > 0.5,
        resolution: 'Handled by operations team.',
      });
    }

    // Handoffs for IN_TRANSIT or later
    if (['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
      const destWh = randomItem(warehouses.filter(w => w.warehouse_id !== originWh.warehouse_id));
      handoffs.push({
        shipment_id: ship.shipment_id,
        from_warehouse_id: originWh.warehouse_id,
        to_warehouse_id: destWh.warehouse_id,
      });
    }

    shipments.push(ship);
  }

  await prisma.shipmentStatusHistory.createMany({ data: histories });
  await prisma.handoff.createMany({ data: handoffs });
  await prisma.exceptionReport.createMany({ data: exceptions });
  await prisma.deliveryProof.createMany({ data: proofs });
  console.log(`✅ Created ${shipments.length} shipments with history, handoffs, proofs, and exceptions`);

  // 7. Create Invoices
  const invoiceStatuses = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE'];
  const invoices = [];
  for (let i = 1; i <= 40; i++) {
    const o = randomItem(orders);
    const amount = randomInt(200, 5000) + Math.random();
    const isPaid = Math.random() > 0.5;
    invoices.push({
      invoice_number: `INV-2026-${String(i).padStart(4, '0')}`,
      order_id: o.order_id,
      sender_name: o.sender_name,
      amount,
      tax_amount: amount * 0.18,
      total_amount: amount * 1.18,
      status: isPaid ? 'PAID' : randomItem(invoiceStatuses),
      issued_date: new Date(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
      paid_date: isPaid ? new Date() : null,
    });
  }
  await prisma.invoice.createMany({ data: invoices });
  console.log(`✅ Created ${invoices.length} invoices`);

  // 8. Summary
  console.log('\n✨ Database seeding completed!\n');
  console.log('┌────────────────────────────────────────────────────────┐');
  console.log('│            Demo Login Credentials                     │');
  console.log('│            Password: password123 (all accounts)       │');
  console.log('├────────────────────────────────────────────────────────┤');
  console.log('│ ADMIN       │ admin@example.com                       │');
  console.log('│ CUSTOMER    │ customer@example.com                    │');
  console.log('├────────────────────────────────────────────────────────┤');
  console.log('│ Per-Warehouse Accounts:                               │');
  for (const wh of warehouses) {
    const city = wh.city.toLowerCase().replace(/\s+/g, '');
    console.log(`│ ${wh.name.padEnd(20)} │ manager-${city}@example.com`);
    console.log(`│                      │ staff-${city}@example.com`);
    console.log(`│                      │ driver1-${city}@example.com`);
  }
  console.log('└────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
