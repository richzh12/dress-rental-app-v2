import { prisma } from "@/lib/prisma";
import CreateRentalForm from "./create-rental-form";

export default async function CreateRentalPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return <CreateRentalForm customers={customers} />;
}

