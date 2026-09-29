import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'

const posts = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts'}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        category: z.enum(['GO', 'JavaScript', 'API']),
        tags: z.array(z.enum([
            'js',
            'go',
            'dsa',
            'backend',
            'api-design',
            'database',
            'postgres',
            'devops',
            'tooling'
        ])).default([]),
        draft: z.boolean().default(false)
    })
})

const projects = defineCollection({
    loader: glob({
        pattern: '**/*.md',
        base: './src/content/projects',
        generateId: ({  entry }) => entry.replace(/\.md$/,'').split('/').pop() ?? entry
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        status: z.enum(['active', 'wip', 'paused', 'archived']),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().nullable().optional(),
        repo: z.string().url().optional(),
        live: z.string().url().optional(),
        stack: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        order: z.number().default(999),
        openSource: z.boolean().default(false)
    })
})

export const collections = { posts, projects }