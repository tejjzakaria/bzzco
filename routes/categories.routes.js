import express from 'express';
import Category from '../models/categories.model.js';
import { 
    getAllCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    deleteBulkCategories,
    getCategoriesForDataTable,
    getCategoryById
} from '../controllers/categories.controller.js';

const router = express.Router();

// View route for categories page
router.get('/view-categories', getAllCategories);

// API routes for categories CRUD operations
router.get('/api/categories/datatable', getCategoriesForDataTable);
router.get('/api/categories/:id', getCategoryById);
router.post('/api/categories', addCategory);
router.put('/api/categories/:id', updateCategory);
router.delete('/api/categories/bulk/delete', deleteBulkCategories); // Bulk delete must come before single delete
router.delete('/api/categories/:id', deleteCategory);

export default router;
