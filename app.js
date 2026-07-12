
import express from "express";
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";



import { globalErrorHandler } from './middlewares/errorHandler.middleware.js';
import { minutesToMs } from './utils/timeCalculator.utils.js';

import UserRouter from './routes/user.route.js';
import GamesRouter from './routes/games.route.js';

import { validateUserToken } from './middlewares/verifyTokens.middleware.js';


const openapiDocument = YAML.load("./docs/openapi.yaml");
const app = express();

app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiDocument)
);


// middleware 
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/user', UserRouter);
app.use('/api/games', validateUserToken, GamesRouter);

// global handler
app.use(globalErrorHandler);

export default app;