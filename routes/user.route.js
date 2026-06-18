
import express from 'express';
const router = express.Router();
import { asyncHandler } from '../middlewares/globalAsyncHandler.middleware.js';
import * as UserContoller from '../controllers/user.controller.js';
import { validateUserRequest, validateUserVerificationRequest } from '../middlewares/validateUser.middleware.js';


router.post('/register', validateUserRequest, asyncHandler(UserContoller.initiateUserRegistration));
router.post('/register/verify', validateUserVerificationRequest, asyncHandler(UserContoller.verifyRegistrationAndLoginUser));
router.post('/login', validateUserRequest, asyncHandler(UserContoller.loginUser));
router.post('/logout', validateUserRequest, asyncHandler(UserContoller.logoutUser));
router.post('/logout/all', validateUserRequest, asyncHandler(UserContoller.logoutAllDevices));


export default router;
