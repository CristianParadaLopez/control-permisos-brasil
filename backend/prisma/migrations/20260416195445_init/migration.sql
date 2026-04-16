-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'SECRETARIA');

-- CreateEnum
CREATE TYPE "TipoPermiso" AS ENUM ('ENFERMEDAD', 'PERSONAL');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'SECRETARIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnoEscolar" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnoEscolar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maestro" (
    "id" TEXT NOT NULL,
    "nipEscalafon" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "tipoContratacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Maestro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaestroAno" (
    "id" TEXT NOT NULL,
    "maestroId" TEXT NOT NULL,
    "anoEscolarId" TEXT NOT NULL,
    "enfMinUsados" INTEGER NOT NULL DEFAULT 0,
    "persMinUsados" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MaestroAno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" TEXT NOT NULL,
    "maestroId" TEXT NOT NULL,
    "anoEscolarId" TEXT NOT NULL,
    "tipo" "TipoPermiso" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "dias" INTEGER NOT NULL DEFAULT 0,
    "horas" INTEGER NOT NULL DEFAULT 0,
    "minutos" INTEGER NOT NULL DEFAULT 0,
    "totalMinutos" INTEGER NOT NULL,
    "observacion" TEXT,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AnoEscolar_anio_key" ON "AnoEscolar"("anio");

-- CreateIndex
CREATE UNIQUE INDEX "Maestro_nipEscalafon_key" ON "Maestro"("nipEscalafon");

-- CreateIndex
CREATE UNIQUE INDEX "MaestroAno_maestroId_anoEscolarId_key" ON "MaestroAno"("maestroId", "anoEscolarId");

-- AddForeignKey
ALTER TABLE "MaestroAno" ADD CONSTRAINT "MaestroAno_maestroId_fkey" FOREIGN KEY ("maestroId") REFERENCES "Maestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaestroAno" ADD CONSTRAINT "MaestroAno_anoEscolarId_fkey" FOREIGN KEY ("anoEscolarId") REFERENCES "AnoEscolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permiso" ADD CONSTRAINT "Permiso_maestroId_fkey" FOREIGN KEY ("maestroId") REFERENCES "Maestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permiso" ADD CONSTRAINT "Permiso_anoEscolarId_fkey" FOREIGN KEY ("anoEscolarId") REFERENCES "AnoEscolar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
