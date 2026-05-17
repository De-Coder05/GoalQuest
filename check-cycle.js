const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  let cycles = await prisma.goalCycle.findMany();
  if (cycles.length === 0) {
    console.log("No cycle found, creating one...");
    await prisma.goalCycle.create({
      data: {
        name: "FY 2025",
        year: 2025,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2025-03-31'),
        status: "ACTIVE"
      }
    });
    console.log("Created FY 2025 cycle");
  } else {
    console.log("Cycle exists:", cycles[0].name);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
