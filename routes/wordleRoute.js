
import express from 'express';
const router = express.Router();

import { daily, play } from "../controllers/wordleController.js";


router.get('/daily', daily);
router.get('/play', play);






export default router;
