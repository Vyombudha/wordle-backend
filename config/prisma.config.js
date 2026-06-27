import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 1. Set up your native database connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

/**
 * @type {PrismaClient}
 */
let prisma;

if (process.env.NODE_ENV === "production") {
    // 2. Pass the adapter to the constructor
    prisma = new PrismaClient({ adapter });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            adapter, // <-- Required in Prisma 7
            log: ["error", "warn"],
        });
    }
    prisma = global.prisma;
}

export default prisma;