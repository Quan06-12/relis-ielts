import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { listMySets, createSet, getSet, updateSet, deleteSet, addWord, updateWord, deleteWord } from '../controllers/vocab.controller.js'

const router = Router()

router.use(requireAuth)

router.get('/', listMySets)
router.post('/', createSet)
router.get('/:setId', getSet)
router.patch('/:setId', updateSet)
router.delete('/:setId', deleteSet)
router.post('/:setId/words', addWord)
router.put('/:setId/words/:wordId', updateWord)
router.delete('/:setId/words/:wordId', deleteWord)

export default router
