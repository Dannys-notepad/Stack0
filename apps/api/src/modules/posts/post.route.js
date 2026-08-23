import { Router } from 'express'
import { handleGetAllPost } from './post.controller.js'

const router = Router()

router.get('/', handleGetAllPost)

export default router