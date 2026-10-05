import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

if(!process.env.VERCEL) {
    try {
        const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
        for(const line of raw.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eq = trimmed.indexOf('=')
            if (eq === -1) continue
            const key = trimmed.slice(0, eq).trim()
            let value = trimmed.slice(eq + 1).trim()

            if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1)
            }

            if (!process.env[key]) process.env[key] = value
        }
    } catch {
        
    }
}

export const env = {
    siteUrl: process.env.SITE_URL,
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: process.env.SMTP_FROM
    }
}

export function requireEnv(keys) {
    const missing = keys.filter((k) => !process.env[k])
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
}