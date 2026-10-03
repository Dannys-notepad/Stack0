import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import taxonomy from './data/tags.json'

// Single source of truth: categories and tags come from taxonomy.json,
// so adding one there updates validation here automatically.
const toEnum = (items: { slug: string }[]) =>
    z.enum(items.map((item) => item.slug) as [string, ...string[]])

const category = toEnum(taxonomy.categories)
const tag = toEnum(taxonomy.topics)

const posts = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: ({ image }) =>
        z.object({
            title: z.string().min(1).max(120),
            description: z.string().min(1).max(300),
            date: z.coerce.date(),
            updated: z.coerce.date().optional(),
            category,
            tags: z
                .array(tag)
                .default([])
                .transform((list) => [...new Set(list)]),
            cover: image().optional(),
            draft: z.boolean().default(false)
        })
})

const projects = defineCollection({
    loader: glob({
        pattern: '**/*.md',
        base: './src/content/projects',
        generateId: ({ entry }) =>
            entry.replace(/\.md$/, '').split('/').pop() ?? entry
    }),
    schema: ({ image }) =>
        z
            .object({
                title: z.string().min(1).max(120),
                description: z.string().min(1).max(300),
                status: z.enum(['active', 'wip', 'paused', 'archived']),
                startDate: z.coerce.date(),
                endDate: z.coerce.date().nullable().optional(),
                repo: z.string().url().optional(),
                live: z.string().url().optional(),
                stack: z.array(z.string()).default([]),
                cover: image().optional(),
                featured: z.boolean().default(false),
                order: z.number().default(999),
                openSource: z.boolean().default(false)
            })
            .refine((p) => !p.endDate || p.endDate >= p.startDate, {
                message: 'endDate must be on or after startDate',
                path: ['endDate']
            })
})

export const collections = { posts, projects }
