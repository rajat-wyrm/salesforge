const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: "deepika", mode: "insensitive" } },
          { user: { is: { name: { contains: "deepika", mode: "insensitive" } } } },
          { user: { is: { email: { contains: "deepika", mode: "insensitive" } } } }
        ]
      }
    });
    console.log("SUCCESS", res.length);
  } catch (e) {
    console.error("ERROR", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
