import express from 'express';
import {
  getAllSellerApplications,
  getSellerApplicationStats,
  getSellerApplicationById,
  updateApplicationStatus,
  deleteSellerApplication,
  bulkDeleteApplications,
  updateSellerApplication
} from '../controllers/seller-applications.controller.js';

const router = express.Router();

// View routes
router.get('/view-seller-applications', (req, res) => {
  res.render('admin/view-seller-applications', {
    currentPage: 'view-seller-applications',
    title: 'Seller Applications'
  });
});

router.get('/view-seller-application/:id', (req, res) => {
  res.render('admin/view-seller-application-details', {
    currentPage: 'view-seller-applications',
    title: 'Application Details',
    applicationId: req.params.id
  });
});

// API routes (must come after stats to avoid id conflict)
router.get('/api/seller-applications/stats', getSellerApplicationStats);
router.get('/api/seller-applications', getAllSellerApplications);
router.get('/api/seller-applications/:id', getSellerApplicationById);
router.put('/api/seller-applications/:id/status', updateApplicationStatus);
router.put('/api/seller-applications/:id', updateSellerApplication);
router.delete('/api/seller-applications/:id', deleteSellerApplication);
router.post('/api/seller-applications/bulk-delete', bulkDeleteApplications);

export default router;
