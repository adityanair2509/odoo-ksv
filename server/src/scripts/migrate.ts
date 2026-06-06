/**
 * Run on Railway deploy — creates app_store table for JSON persistence in PostgreSQL.
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg

async function main(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        // eslint-disable-next-line no-console
        console.log('ℹ️  DATABASE_URL not set — using local file storage (server/data/store.json)')
        return
    }

    const sqlPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../database/railway-bootstrap.sql',
    )
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    const client = new Client({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })

    await client.connect()
    await client.query(sql)
    await client.end()
    // eslint-disable-next-line no-console
    console.log('✅ PostgreSQL ready (app_store table)')
}

main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('❌ Database migration failed:', err)
    process.exit(1)
})
