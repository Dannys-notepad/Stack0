import { Hono } from 'hono'
import { sValidator } from '@hono/standard-validator'
import * as controller from './post.controller'
import { createPostSchema, updatePostSchema } from './post.validator'

const app = new Hono()

app.get('/', controller.getAllPosts)
app.get('/:slug', controller.getPostBySlug)
app.post('/', sValidator('json', createPostSchema), controller.createPost)
app.patch('/:slug', sValidator('json', updatePostSchema), controller.updatePost)
app.delete('/:slug', controller.deletePost)


export default app
