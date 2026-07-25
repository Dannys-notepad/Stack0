import { db } from '../../config/firebase.ts'
import type { Post } from './post.model.ts'

// FIND ALL POSTS
export const findAll = async () => {
  try {
    const snapshot = await db.collection("posts").get()

    return snapshot.docs.map(doc => doc.data())

  } catch (error) {
    console.error("Error finding all posts", error)
    throw error
  }
}

// FIND POST BY SLUG 
export const findOne = async (slug: string) => {
  try {
    const doc = await db.collection('posts').doc(slug).get()
    return doc.exists ? doc.data() : null
  } catch (error) {
    console.error(`Error finding post with slug ${slug}`)
  }
}

//  CREATE POST
export const create = async (post: any) => {
  try {
    await db.collection('posts').doc(post.slug).set(post)
  } catch (error) {
    console.log('Error create post', error)
  }
}

// UPDATE A POST
export const update = async (slug: string, updates: Partial<Post>) => {
  try {
    const docRef = db.collection('posts').doc(slug)
    const doc = await docRef.get()
    //console.log(doc.exists)
    if(!doc.exists){
      return null
    }
  
    const now = new Date().toISOString()
  
    await docRef.update({
      ...updates,
      updatedAt: now
    })
  
    const updatedDoc = await docRef.get()
  
    return updatedDoc.data() as Post
  } catch (error) {
    console.error('Error updating post', error)
  }
}

// DELETE POST
export const remove = async (slug: string) => {
  try {
    
    const docRef = db.collection('posts').doc(slug)
    const doc = await docRef.get()
    //console.log(doc.exists)
    if(!doc.exists){
      return false
    }
    
    await docRef.delete()
    
    return true
  } catch (error) {
    console.error('Error deleting post', error)
  }
}
