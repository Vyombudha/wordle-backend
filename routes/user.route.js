
import express from 'express';
const router = express.Router();
import { asyncHandler } from '../middlewares/globalAsyncHandler.middleware.js';
import * as UserController from '../controllers/user.controller.js';
import { validateUserRequest, validateUserVerificationRequest } from '../middlewares/validateUser.middleware.js';
import { validateUserToken } from '../middlewares/verifyTokens.middleware.js';

import { tokenLimiter, authLimiter } from '../middlewares/limiters.middleware.js';

// limited endpoint
router.post('/register', authLimiter, validateUserRequest, asyncHandler(UserController.initiateUserRegistration));
router.post('/register/verify', authLimiter, validateUserVerificationRequest, asyncHandler(UserController.verifyRegistration));
router.post('/login', authLimiter, validateUserRequest, asyncHandler(UserController.login));


// not limited
router.get('/me', validateUserToken, asyncHandler(UserController.getUserData));
router.post('/logout', validateUserToken, asyncHandler(UserController.logout));
router.post('/logout/all', validateUserToken, asyncHandler(UserController.logoutAllDevices));


// token limited endpoint
router.post('/token/rotate', tokenLimiter, asyncHandler(UserController.rotateTokens));


export default router;
