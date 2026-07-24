import { Context } from 'hono'
import * as service from './post.service'

// GET ALL POSTS 
export const getAllPosts = async (c: Context) => {
  try {
    const posts = await service.getAllPosts()
    const { message, data, status } = posts
    return c.json({ message, data }, status)
  } catch (error: any) {
    return c.json({error: 'Server Error'}, 500)
    throw error
  }
}

// GET A POST
export const getPostBySlug = async (c: Context) => {
  try {
    const slug = c.req.param('slug')
    const post = await service.getPostBySlug(slug)
    const { message, data, status} = post
    return c.json({ message, data }, status)
  } catch (error: any) {
    return c.json({error: 'Server Error'}, 500)
    throw error 
  }
}

// CREATE POST
export const createPost = async (c: Context) => {
  const input = await c.req.valid("json")
  //console.log(input)

  try {
    const result = await service.createPost(input)

    const { message, data, status } = result

    return c.json({ message, data }, status)

  } catch (error: any) {
    console.error(error)
    return c.json({ error: "Server Error" }, 500)
  }
}