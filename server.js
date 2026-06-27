import 'dotenv/config';
import express from "express";
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';


import { globalErrorHandler } from './middlewares/errorHandler.middleware.js';
import { minutesToMs } from './utils/timeCalculator.utils.js';

import UserRouter from './routes/user.route.js';
import GamesRouter from './routes/games.route.js';

import { validateUserToken } from './middlewares/verifyTokens.middleware.js';


const app = express();
const PORT = process.env.PORT;

// middleware 
app.use(express.json());

// Routes
app.use('/user', UserRouter);
app.use('/games', validateUserToken, GamesRouter);

// global handler
app.use(globalErrorHandler);


app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
})