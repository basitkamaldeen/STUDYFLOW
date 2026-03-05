import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: './dev.db'
})

const globalForPrisma = globalThis as unknown as { prisma?: any }

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  adapter
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }