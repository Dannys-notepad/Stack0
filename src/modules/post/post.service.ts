import type { CreatePostInput, Post, UpdatePostInput } from './post.model.ts'
import type { NewsLetter } from '../newsletter/newsletter.model.ts'
import * as repo from './post.repository.ts'
import toSlug from '../../lib/lib.toSlug.ts'
import mail from '../../lib/lib.mail.ts'
import { AppError, fail, ok, type ApiResponse } from '../../lib/http.ts'

// Return all posts from the database.
export const fetchAllPosts = async (): Promise<ApiResponse<Post[]>> => {
  try {
    const allPosts = await repo.findAllPosts()

    if (allPosts.length === 0) {
      return fail('No posts yet', 200)
    }

    return ok('All posts', allPosts)
  } catch (error) {
    console.error('Error getting all posts', error)
    throw new AppError('Could not fetch posts', 500, error)
  }
}

// Fetch one post by its slug.
export const fetchPostBySlug = async (slug: string): Promise<ApiResponse<Post | null>> => {
  if (!slug) {
    return fail('Pass slug in url to find post', 400)
  }

  try {
    const post = await repo.findPostBySlug(slug)

    if (!post) {
      return fail('Post not found', 404)
    }

    return ok('Post', post)
  } catch (error) {
    console.error(`Error getting post with slug ${slug}`, error)
    throw new AppError('Could not fetch post', 500, error)
  }
}

// Create a new post, then notify subscribed users by email.
export const createNewPost = async (data: CreatePostInput): Promise<ApiResponse<{ createPost: Post | null; mailSent: string }>> => {
  try {
    // Convert the title into a URL-friendly slug.
    const slug = toSlug(data.title)
    const postExists = await repo.findPostBySlug(slug)

    if (postExists) {
      return fail('This post already exists', 409, { createPost: postExists, mailSent: 'Post already exists' })
    }

    // Add metadata that is not provided by the client.
    const now = new Date().toISOString()
    const post: Post = {
      ...data,
      slug,
      views: 0,
      readingTime: 5,
      createdAt: now,
      updatedAt: now,
    }

    const createPost = await repo.createPost(post)
    const newsletter = await repo.findAllNewsletterSubscribers()
    let mailSent = 'No subscribed mails to send newsletters yet'

    if (newsletter.length > 0) {
      // Only subscribed users should receive notification emails.
      const emails = newsletter
        .filter((entry: NewsLetter) => entry.status === 'subscribed')
        .map((entry: NewsLetter) => entry.email)

      const mailFormat = {
        subject: 'New Post Alert',
        text: `New post titled ${post.title} on stack0, check it out`,
        email: emails,
      }

      mailSent = (await mail(mailFormat)) ? 'Newsletter mails sent' : 'Newsletter mails not sent'
    }

    return ok('Post created', { createPost, mailSent }, 201)
  } catch (error) {
    console.error('Error creating post', error)
    throw new AppError('Could not create post', 500, error)
  }
}

// Update an existing post using its slug.
export const updateExistingPost = async (slug: string, data: UpdatePostInput): Promise<ApiResponse<Post | null>> => {
  if (!slug || !data) {
    return fail('Either slug or data body was not provided', 400)
  }

  try {
    const updated = await repo.updatePost(slug, data)

    if (!updated) {
      return fail('Post does not exist', 404)
    }

    return ok('Post updated', updated)
  } catch (error) {
    console.error('Error updating post', error)
    throw new AppError('Could not update post', 500, error)
  }
}

// Delete a post from the database.
export const deleteExistingPost = async (slug: string): Promise<ApiResponse<boolean>> => {
  if (!slug) {
    return fail('Slug was not provided in the url', 400)
  }

  try {
    const deleted = await repo.deletePost(slug)

    if (!deleted) {
      return fail('Post does not exist', 404)
    }

    return ok('Post deleted', true)
  } catch (error) {
    console.error('Error deleting post', error)
    throw new AppError('Could not delete post', 500, error)
  }
}
