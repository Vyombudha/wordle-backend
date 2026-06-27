
import express from 'express';
const router = express.Router();

import * as GameController from '../controllers/games.controller.js';
import { asyncHandler } from '../middlewares/globalAsyncHandler.middleware.js'
import { guessLimiter, startGameLimiter, readLimiter } from '../middlewares/limiters.middleware.js';

router.get('/', readLimiter, asyncHandler(GameController.getAll));

router.post('/', startGameLimiter, asyncHandler(GameController.start));
router.get('/:gameID', readLimiter, asyncHandler(GameController.getGame));
router.post('/:gameID/guess', guessLimiter, asyncHandler(GameController.guess));
router.post('/:gameID/skip', startGameLimiter, asyncHandler(GameController.skip));
router.delete('/:gameID', startGameLimiter, asyncHandler(GameController.remove));

export default router;
