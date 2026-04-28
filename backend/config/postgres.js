const { PrismaClient } = require('@prisma/client');
// Reuse one Prisma client across the process so connection pooling stays predictable.
const prisma = new PrismaClient();

const connectPostgres = async () => {
    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL connected successfully via Prisma');
    } catch (error) {
        // Fail fast on boot because the rest of the API cannot serve meaningful responses without the database.
        console.error('❌ PostgreSQL connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { connectPostgres, prisma };
