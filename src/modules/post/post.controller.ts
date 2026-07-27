import type { Context } from 'hono'
import * as service from './post.service.ts'
import { AppError } from '../../lib/http.ts'
import type { CreatePostInput, UpdatePostInput } from './post.model.ts'

// A small helper that sends JSON responses with an explicit HTTP status code.
const sendJson = (c: Context, body: unknown, status: number) => {
  const httpStatus = status as 200 | 201 | 400 | 404 | 409 | 500
  return c.json(body, httpStatus)
}

// Return all posts from the service layer.
export const handleFetchAllPosts = async (c: Context) => {
  try {
    const posts = await service.fetchAllPosts()
    const { message, data, status } = posts
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}

// Read the slug from the URL and ask the service for one post.
export const handleFetchPostBySlug = async (c: Context) => {
  try {
    const slug = c.req.param('slug') ?? ''
    const post = await service.fetchPostBySlug(slug)
    const { message, data, status } = post
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}

// Read the JSON body from the request and pass it to the service for creating a post.
export const handleCreateNewPost = async (c: Context) => {
  const input = await c.req.json<CreatePostInput>()

  try {
    const result = await service.createNewPost(input)
    const { message, data, status } = result
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}

// Read the slug and the JSON body, then update the existing post.
export const handleUpdateExistingPost = async (c: Context) => {
  const slug = c.req.param('slug') ?? ''
  const input = await c.req.json<UpdatePostInput>()

  try {
    const result = await service.updateExistingPost(slug, input)
    const { message, data, status } = result
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}

// Delete a post using the slug from the URL.
export const handleDeleteExistingPost = async (c: Context) => {
  const slug = c.req.param('slug') ?? ''

  try {
    const result = await service.deleteExistingPost(slug)
    const { message, data, status } = result
    return sendJson(c, { message, data }, status)
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('Server error', 500, error)
    return sendJson(c, { error: appError.message }, appError.status)
  }
}
