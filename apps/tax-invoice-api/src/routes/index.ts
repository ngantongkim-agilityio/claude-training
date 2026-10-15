import { Router } from 'express'

// Constants
import { API_PREFIX } from '@/constants/api'

import v1Router from './v1'
import v2Router from './v2'

const router: Router = Router()

router.use(API_PREFIX.v1, v1Router)
router.use(API_PREFIX.v2, v2Router)

export default router
