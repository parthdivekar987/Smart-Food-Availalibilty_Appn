import { PrismaClient, OrderStatus, PaymentStatus, PaymentMethod, TableSessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedOrders() {
  console.log("🌱 Seeding realistic Live Orders & Dashboard Analytics...");

  const restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    console.error("Restaurant not found");
    return;
  }

  // Get tables and menu items
  const tables = await prisma.table.findMany({ take: 8 });
  const items = await prisma.menuItem.findMany();
  const customers = await prisma.user.findMany({ where: { role: 'CUSTOMER' }, take: 8 });

  if (tables.length === 0 || items.length === 0) {
    console.error("Tables or items missing");
    return;
  }

  // 1. Create active sessions for tables
  console.log("Creating active table sessions...");
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    // Close existing sessions
    await prisma.tableSession.updateMany({
      where: { tableId: table.id, status: TableSessionStatus.OPEN },
      data: { status: TableSessionStatus.CLOSED, endedAt: new Date() },
    });

    const isOccupied = i % 2 === 0; // Tables 0, 2, 4, 6 occupied
    if (isOccupied) {
      const session = await prisma.tableSession.create({
        data: {
          tableId: table.id,
          status: TableSessionStatus.OPEN,
          startedAt: new Date(Date.now() - (i + 1) * 15 * 60 * 1000),
        },
      });

      // Create an order for this session
      const randomItem1 = items[i % items.length];
      const randomItem2 = items[(i + 3) % items.length];
      const total = randomItem1.price + randomItem2.price;

      const orderStatuses = [OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED, OrderStatus.COMPLETED];
      const status = orderStatuses[i % orderStatuses.length];

      const order = await prisma.order.create({
        data: {
          tableSessionId: session.id,
          userId: customers[i % customers.length]?.id,
          status: status,
          totalAmount: total,
          createdAt: new Date(Date.now() - (i + 1) * 12 * 60 * 1000),
          items: {
            create: [
              {
                menuItemId: randomItem1.id,
                quantity: 1,
                price: randomItem1.price,
                status: status,
              },
              {
                menuItemId: randomItem2.id,
                quantity: 1,
                price: randomItem2.price,
                status: status,
              },
            ],
          },
        },
      });

      // Create Payment for completed/served orders
      if (status === OrderStatus.COMPLETED || status === OrderStatus.SERVED) {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: PaymentMethod.CASH,
            status: PaymentStatus.PAID,
            amount: total,
            paidAt: new Date(),
          },
        });
      }

      console.log(`  -> Table ${table.name}: Session ${session.id} with Order #${order.id.slice(0, 8)} (${status}) - Total: ${total}`);
    }
  }

  // Also create a few completed historical orders for revenue chart
  console.log("Creating historical revenue orders for analytics chart...");
  const firstTable = tables[0];
  for (let h = 1; h <= 6; h++) {
    const historicalSession = await prisma.tableSession.create({
      data: {
        tableId: firstTable.id,
        status: TableSessionStatus.CLOSED,
        startedAt: new Date(Date.now() - h * 3600 * 1000),
        endedAt: new Date(Date.now() - (h - 1) * 3600 * 1000),
      },
    });

    const item = items[h % items.length];
    const historicalOrder = await prisma.order.create({
      data: {
        tableSessionId: historicalSession.id,
        status: OrderStatus.COMPLETED,
        totalAmount: item.price * 2,
        createdAt: new Date(Date.now() - h * 3600 * 1000),
        items: {
          create: [
            {
              menuItemId: item.id,
              quantity: 2,
              price: item.price,
              status: OrderStatus.COMPLETED,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        orderId: historicalOrder.id,
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PAID,
        amount: item.price * 2,
        paidAt: new Date(Date.now() - h * 3600 * 1000),
      },
    });
  }

  console.log("✅ Successfully seeded live orders, payments and active table sessions!");
}

seedOrders()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
