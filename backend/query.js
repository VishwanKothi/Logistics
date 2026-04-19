const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shipments = await prisma.shipment.findMany({ select: { shipment_id: true, status: true, origin_warehouse_id: true, dest_warehouse_id: true } });
  console.log(JSON.stringify(shipments, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
