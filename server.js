import 'dotenv/config';
import express from "express";
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT;
const globalLimiter = rateLimit({
    windowMs: 5 * (60 * 1000),
    max: 100
});

import wordleRouter from './routes/wordleRoute.js';

// middle ware for json
app.use(globalLimiter);
app.use(express.json());



// Routes
app.use('/game', wordleRouter);

app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
})