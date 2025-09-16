import express from 'express';
import { list } from '../controllers/jobApplication.controller.js';
const router = express.Router();

router.get('/list', list);

export default router;
