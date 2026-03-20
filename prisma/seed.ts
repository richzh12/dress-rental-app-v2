import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentTarget,
  PrismaClient,
  RentalStatus,
  SaleStatus,
  DressUnitStatus,
  BlockReason,
} from "../node_modules/.prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no esta definida en el entorno.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean in dependency order so seed can be re-run safely.
  await prisma.payment.deleteMany();
  await prisma.maintenanceBlock.deleteMany();
  await prisma.rentalItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.dressUnit.deleteMany();
  await prisma.dress.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.adminUser.deleteMany();

  const admin = await prisma.adminUser.create({
    data: {
      email: "admin@dressrental.local",
      passwordHash:
        "$2b$12$GS5AxKF7HvYaMNswxiyzOeOqfOHkbJQFjBV75ckQFTIfPD7yJ26ba",
      fullName: "Richard Admin",
    },
  });

  const customerA = await prisma.customer.create({
    data: {
      firstName: "Ana",
      lastName: "Martinez",
      email: "ana.martinez@example.com",
      phone: "+34 600 111 222",
      documentId: "DNI-12345678A",
      notes: "Cliente frecuente",
    },
  });

  const customerB = await prisma.customer.create({
    data: {
      firstName: "Sofia",
      lastName: "Lopez",
      email: "sofia.lopez@example.com",
      phone: "+34 600 333 444",
      documentId: "DNI-87654321B",
    },
  });

  const dressA = await prisma.dress.create({
    data: {
      modelName: "Aurora Satin",
      brand: "Atelier Luna",
      color: "Rojo vino",
      size: "M",
      description: "Vestido largo satinado para evento de noche",
      rentalPriceCents: 12000,
      salePriceCents: 65000,
    },
  });

  const dressB = await prisma.dress.create({
    data: {
      modelName: "Nube Tul",
      brand: "Casa Vela",
      color: "Azul marino",
      size: "S",
      description: "Vestido midi de tul para coctel",
      rentalPriceCents: 9000,
      salePriceCents: 42000,
    },
  });

  const unitA1 = await prisma.dressUnit.create({
    data: {
      dressId: dressA.id,
      inventoryCode: "AURORA-M-001",
      status: DressUnitStatus.AVAILABLE,
    },
  });

  const unitA2 = await prisma.dressUnit.create({
    data: {
      dressId: dressA.id,
      inventoryCode: "AURORA-M-002",
      status: DressUnitStatus.MAINTENANCE,
      conditionNotes: "Pendiente de ajuste de cierre",
    },
  });

  const unitB1 = await prisma.dressUnit.create({
    data: {
      dressId: dressB.id,
      inventoryCode: "NUBE-S-001",
      status: DressUnitStatus.AVAILABLE,
    },
  });

  const now = new Date();
  const rentalStart = new Date(now);
  rentalStart.setDate(rentalStart.getDate() + 3);
  const rentalEnd = new Date(rentalStart);
  rentalEnd.setDate(rentalEnd.getDate() + 2);

  const subtotalCents = 12000;
  const depositRequiredCents = 3600;
  const balanceDueCents = subtotalCents - depositRequiredCents;

  const rental = await prisma.rental.create({
    data: {
      customerId: customerA.id,
      createdById: admin.id,
      status: RentalStatus.RESERVED,
      startDate: rentalStart,
      endDate: rentalEnd,
      subtotalCents,
      depositRequiredCents,
      balanceDueCents,
      totalPaidCents: depositRequiredCents,
      notes: "Reserva para boda, entrega un dia antes",
    },
  });

  await prisma.rentalItem.create({
    data: {
      rentalId: rental.id,
      dressUnitId: unitA1.id,
      startsAt: rentalStart,
      endsAt: rentalEnd,
      priceCents: subtotalCents,
    },
  });

  await prisma.payment.create({
    data: {
      target: PaymentTarget.RENTAL,
      rentalId: rental.id,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.PAID,
      amountCents: depositRequiredCents,
      paidAt: now,
      reference: "DEP-RES-001",
      notes: "Deposito 30%",
    },
  });

  await prisma.maintenanceBlock.create({
    data: {
      dressUnitId: unitA2.id,
      startAt: now,
      endAt: rentalEnd,
      reason: BlockReason.MAINTENANCE,
      notes: "No disponible hasta finalizar reparacion",
    },
  });

  const sale = await prisma.sale.create({
    data: {
      customerId: customerB.id,
      createdById: admin.id,
      dressId: dressB.id,
      dressUnitId: unitB1.id,
      status: SaleStatus.COMPLETED,
      totalCents: 42000,
      notes: "Venta mostrador",
    },
  });

  await prisma.payment.create({
    data: {
      target: PaymentTarget.SALE,
      saleId: sale.id,
      method: PaymentMethod.CARD,
      status: PaymentStatus.PAID,
      amountCents: 42000,
      paidAt: now,
      reference: "SALE-001",
    },
  });

  await prisma.dressUnit.update({
    where: { id: unitB1.id },
    data: { status: DressUnitStatus.RETIRED },
  });

  console.log("Seed completado: admin, clientes, vestidos, unidades, alquiler, pagos y venta.");
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
