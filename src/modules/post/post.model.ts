// A post can only be in one of these two states.
export type PostStatus = 'draft' | 'published'

// The main shape of a blog post in the application.
export type Post = {
  slug: string
  title: string
  content: string
  excerpt: string
  tag: string
  metaTitle?: string
  metaDescription?: string
  status: PostStatus
  views: number
  readingTime: number
  createdAt: string
  updatedAt: string
}

// The fields the client must provide when creating a post.
// We omit server-managed fields like slug and timestamps.
export type CreatePostInput = Omit<Post, 'slug' | 'views' | 'readingTime' | 'createdAt' | 'updatedAt'>

// The fields that may be updated later.
// This keeps the update request flexible while still being typed.
export type UpdatePostInput = Partial<CreatePostInput> & {
  views?: number
  readingTime?: number
}

// FOR FUTURE IMPLEMENTATIONS
/*
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
}*/
