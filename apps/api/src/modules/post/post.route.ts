import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as controller from './post.controller'
import { createPostSchema } from './post.validator'

const app = new Hono()

app.get('/', controller.getAllPosts)
app.get('/:slug', controller.getPostBySlug)
app.post('/', sValidator('json', createPostSchema), controller.createPost)

export default app