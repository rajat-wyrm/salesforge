const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const [total, byPlan, byStatus] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.groupBy({ by: ["plan"], _count: { plan: true } }),
      prisma.organization.groupBy({ by: ["status"], _count: { status: true } }),
    ]);
    console.log("SUCCESS", total, byPlan.length, byStatus.length);
  } catch (e) {
    console.error("ERROR", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
