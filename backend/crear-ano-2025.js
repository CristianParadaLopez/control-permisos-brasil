require('dotenv').config(); // Carga las variables de entorno
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ano = await prisma.anoEscolar.create({
    data: {
      anio: 2025,
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2025-12-31'),
      activo: true,
    },
  });
  console.log('✅ Año escolar 2025 creado. ID:', ano.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());