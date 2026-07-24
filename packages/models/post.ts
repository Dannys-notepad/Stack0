export type Post = {
  slug: string
  title: string
  content: string
  excerpt: string
  coverImage?: string

  tags: string[]

  series?: {
    slug: string
    title: string
    order: number
  }

  relatedSlugs?: string[]

  metaTitle?: string
  metaDescription?: string

  status: "draft" | "published"

  views: number
  readingTime: number

  createdAt: string
  updatedAt: string
}