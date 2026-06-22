import 'dotenv/config';
import express from "express";
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';


import { globalErrorHandler } from './middlewares/errorHandler.middleware.js';
import { minutesToMs } from './utils/timeCalculator.utils.js';

import UserRouter from './routes/user.route.js';

const app = express();
const PORT = process.env.PORT;
const globalLimiter = rateLimit({
    windowMs: minutesToMs(5),
    max: 100
});


// middleware 
app.use(globalLimiter);
app.use(cookieParser());
app.use(express.json());


// Routes
app.use('/user', UserRouter);

// global handler
app.use(globalErrorHandler);



app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
})