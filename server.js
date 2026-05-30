import 'dotenv/config';
import express from "express";
import rateLimit from 'express-rate-limit';


import { globalErrorHandler } from './middlewares/errorHandler.js';
import { minutesToMs } from './utils/minuteCalculator.js';
import wordleRouter from './routes/wordleRoute.js';


const app = express();
const PORT = process.env.PORT;
const globalLimiter = rateLimit({
    windowMs: minutesToMs(5),
    max: 100
});


// middle ware for json
app.use(globalLimiter);
app.use(express.json());



// Routes
app.use('/game', wordleRouter);


// global handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
})