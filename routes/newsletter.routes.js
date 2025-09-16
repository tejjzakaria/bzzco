import express from 'express';
import { list } from '../controllers/newsletter.controller.js';
const router = express.Router();

router.get('/list', list);

export default router;
