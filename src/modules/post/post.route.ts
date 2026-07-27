import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as controller from './post.controller.ts'
import { createPostSchema, updatePostSchema } from './post.validator.ts'

// This router handles all endpoints related to blog posts.
const app = new Hono()

// Get all posts.
app.get('/', controller.handleFetchAllPosts)

// Get one post by its slug.
app.get('/:slug', controller.handleFetchPostBySlug)

// Create a new post and validate the incoming JSON first.
app.post('/', sValidator('json', createPostSchema), controller.handleCreateNewPost)

// Update a post by slug.
app.patch('/:slug', sValidator('json', updatePostSchema), controller.handleUpdateExistingPost)

// Delete a post by slug.
app.delete('/:slug', controller.handleDeleteExistingPost)

export default app
