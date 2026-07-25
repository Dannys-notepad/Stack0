import type { Post } from './post.model.ts'
import * as repo from './post.repository'
import toSlug from '../../lib/toSlug.ts'

// GET ALL POSTS
export const getAllPosts = async () => {
  let message = 'All posts'
  let status = 200
  
  try {
    const allPosts = await repo.findAll()
    const data = allPosts
    
    if(data.length === 0){
      message = 'No posts yet'
    }
    
    return {
      message,
      data,
      status
    }
  } catch (error: any) {
    console.error('Error getting all posts', error)
  }
}

//GET  A POST BY SLUG
export const getPostBySlug = async (slug: any) => {
  if(!slug) {
    return {
      message: 'Pass slug in url to find post',
      data: null,
      status: 400
    }
  }
  try {
    const post = await repo.findOne(slug)
    if(!post){
      return {
        message: 'Post not found',
        data: post,
        status: 404
      }
    }

    return {
      message: 'Post',
      data: post,
      status: 200
    }
  } catch (error: any) {
    console.log(`Error getting post with slug ${slug}`, error)
  }
}


// CREATE A POST
export const createPost = async (data: any) => {
  try {
    const slug = toSlug(data.title)
    const postExists = await repo.findOne(slug)
    if(postExists) {
      return {
        message: 'This post already exists',
        data: postExists,
        status: 409
      }
    }

    const excerpt = data.content.slice(0, 140)
    const now = new Date().toISOString()
    const post: Post = {
      ...data,
      slug,
      excerpt,
      views: 0,
      readingTime: 5,
      createdAt: now,
      updatedAt: now
    }
    const create = await repo.create(post)
    return {
      message: 'Post created',
      data: create,
      status: 201
    }
  } catch (error: any) {
    console.error('Error creating post', error)
  }
}

// UPDATE POST
export const updatePost = async (slug, data) => {
  //console.log(slug, data)
  if(!slug || !data){
    return {
      message: 'either slug or data body was not provided',
      data: null,
      status: 400
    }
  }
  
  try {
    const updated = await repo.update(slug, data)
    //console.log(updated)
    if(!updated){
      return {
        message: 'post does not exist',
        data: updated,
        status: 404
      }
    }
    
    return {
      message: 'post updated',
      data: updated,
      status: 200
    }
    
  } catch (error) {
    console.error('Error updating post', error)
  }
}

// DELETE POST
export const deletePost = async (slug) => {
  if(!slug){
    return {
      message: 'slug was not provided in the url',
      data: null,
      status: 400
    }
  }
  
  try {
    const deleted = await repo.remove(slug)
    //console.log(deleted)
    
    if(!deleted){
      return {
        message: 'post does not exist',
        data: deleted,
        status: 404
      }
    }
    
    return {
      message: 'post deleted',
      data: deleted,
      status: 200
    }
    
  } catch (error) {
    console.error('Error deleting post', error)
  }
}

