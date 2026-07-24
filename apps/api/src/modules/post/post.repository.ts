import { db } from '../../config/firebase.ts'

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
    const doc: any = await db.collection('posts').doc(slug).get()
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