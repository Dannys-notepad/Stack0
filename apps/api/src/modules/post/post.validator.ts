import { z } from "zod"

export const createPostSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),

  //excerpt: z.string().min(20),

  coverImage: z.string().url().optional(),

  tags: z.array(z.string()).default([]),

  series: z
    .object({
      slug: z.string(),
      title: z.string(),
      order: z.number().int().min(1),
    })
    .optional(),

  relatedSlugs: z.array(z.string()).optional(),

  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),

  status: z.enum(["draft", "published"]).default("draft"),
})