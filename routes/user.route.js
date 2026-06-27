
import express from 'express';
const router = express.Router();
import { asyncHandler } from '../middlewares/globalAsyncHandler.middleware.js';
import * as UserContoller from '../controllers/user.controller.js';
import { validateUserRequest, validateUserVerificationRequest } from '../middlewares/validateUser.middleware.js';
import { validateUserToken } from '../middlewares/verifyTokens.middleware.js';

import { tokenLimiter, authLimiter } from '../middlewares/limiters.middleware.js';

// limited endpoint
router.post('/register', authLimiter, validateUserRequest, asyncHandler(UserContoller.initiateUserRegistration));
router.post('/register/verify', authLimiter, validateUserVerificationRequest, asyncHandler(UserContoller.verifyRegistration));
router.post('/login', authLimiter, validateUserRequest, asyncHandler(UserContoller.login));

// not limited
router.post('/logout', validateUserToken, asyncHandler(UserContoller.logout));
router.post('/logout/all', validateUserToken, asyncHandler(UserContoller.logoutAllDevices));


// token limited endpoint
router.post('/token/rotate', tokenLimiter, asyncHandler(UserContoller.rotateTokens));


export default router;
