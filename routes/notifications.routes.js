import express from 'express';
import {
  getAllNotifications,
  getUserNotifications,
  getNotificationStats,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  bulkDeleteNotifications,
  markAsRead,
  dismissNotification,
  trackClick,
  updateScheduledNotifications
} from '../controllers/notifications.controller.js';
import { verifyToken } from '../middleware/jwt.middleware.js';

const router = express.Router();

// View routes (Admin UI)
router.get('/view-notifications', (req, res) => {
  res.render('admin/view-notifications', {
    currentPage: 'view-notifications',
    title: 'Manage Notifications'
  });
});

router.get('/add-notification', (req, res) => {
  res.render('admin/add-notification', {
    currentPage: 'view-notifications',
    title: 'Create Notification'
  });
});

router.get('/edit-notification/:id', (req, res) => {
  res.render('admin/edit-notification', {
    currentPage: 'view-notifications',
    title: 'Edit Notification',
    notificationId: req.params.id
  });
});

// API routes - Admin
router.get('/api/notifications', verifyToken, getAllNotifications);
router.get('/api/notifications/stats', verifyToken, getNotificationStats);
router.get('/api/notifications/:id', verifyToken, getNotificationById);
router.post('/api/notifications', verifyToken, createNotification);
router.put('/api/notifications/:id', verifyToken, updateNotification);
router.delete('/api/notifications/:id', verifyToken, deleteNotification);
router.post('/api/notifications/bulk-delete', verifyToken, bulkDeleteNotifications);

// API routes - User
router.get('/api/user/notifications', verifyToken, getUserNotifications);
router.post('/api/notifications/:id/read', verifyToken, markAsRead);
router.post('/api/notifications/:id/dismiss', verifyToken, dismissNotification);
router.post('/api/notifications/:id/click', verifyToken, trackClick);

// API routes - System (for cron jobs)
router.post('/api/notifications/update-scheduled', updateScheduledNotifications);

export default router;
