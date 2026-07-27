import { db } from '../../config/firebase.ts'
import type { Post, UpdatePostInput } from './post.model.ts'
import type { NewsLetter } from '../newsletter/newsletter.model.ts'

// Read all newsletter subscribers from Firestore.
export const findAllNewsletterSubscribers = async (): Promise<NewsLetter[]> => {
  try {
    const snapshot = await db.collection('newsletter').get()
    return snapshot.docs.map((doc) => doc.data() as NewsLetter)
  } catch (error) {
    console.error('Error finding newsletter subscribers', error)
    throw error
  }
}

// Read all posts from the posts collection.
export const findAllPosts = async (): Promise<Post[]> => {
  try {
    const snapshot = await db.collection('posts').get()
    return snapshot.docs.map((doc) => doc.data() as Post)
  } catch (error) {
    console.error('Error finding all posts', error)
    throw error
  }
}

// Find one post by its document id (slug).
export const findPostBySlug = async (slug: string): Promise<Post | null> => {
  try {
    const doc = await db.collection('posts').doc(slug).get()
    return doc.exists ? (doc.data() as Post) : null
  } catch (error) {
    console.error(`Error finding post with slug ${slug}`, error)
    throw error
  }
}

// Create a new post document in Firestore.
export const createPost = async (post: Post): Promise<Post | null> => {
  try {
    await db.collection('posts').doc(post.slug).set(post)
    return post
  } catch (error) {
    console.error('Error creating post', error)
    throw error
  }
}

// Update an existing post document.
export const updatePost = async (slug: string, updates: UpdatePostInput): Promise<Post | null> => {
  try {
    const docRef = db.collection('posts').doc(slug)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const now = new Date().toISOString()

    await docRef.update({
      ...updates,
      updatedAt: now,
    })

    const updatedDoc = await docRef.get()
    return updatedDoc.data() as Post
  } catch (error) {
    console.error('Error updating post', error)
    throw error
  }
}

// Delete a post document from Firestore.
export const deletePost = async (slug: string): Promise<boolean> => {
  try {
    const docRef = db.collection('posts').doc(slug)
    const doc = await docRef.get()

    if (!doc.exists) {
      return false
    }

    await docRef.delete()
    return true
  } catch (error) {
    console.error('Error deleting post', error)
    throw error
  }
}
