import type { Post } from '@stack0/models'
import * as repo from './post.repository'
import toSlug from '../../lib/toSlug.ts'

// GET ALL POSTS
export const getAllPosts = async () => {
  try {
    const allPosts = await repo.findAll()
    
    if(allPosts.length === 0){
      return {
        message: 'No posts yet',
        data: allPosts,
        status: 200
      }
    }
    
    return {
      message: 'All posts',
      data: allPosts,
      status: 200
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
    console.log('Error creating post', error)
  }
}