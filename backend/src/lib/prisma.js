const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Se crea UNA SOLA instancia para todo el proyecto
const prisma = new PrismaClient({ adapter });

module.exports = prisma;