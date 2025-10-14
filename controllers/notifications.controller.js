import Notification from '../models/notification.model.js';

// Get all notifications (admin view)
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get notifications for current user
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.sub; // Auth0 user ID
    const userRole = req.user?.['app_metadata']?.role || req.user?.['user_metadata']?.role || 'customer';

    const now = new Date();

    // Find active notifications for user's role
    const notifications = await Notification.find({
      $and: [
        {
          $or: [
            { targetAudience: 'all' },
            { targetAudience: userRole }
          ]
        },
        { status: 'active' },
        {
          $or: [
            { scheduledFor: { $lte: now } },
            { scheduledFor: null }
          ]
        },
        {
          $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null }
          ]
        }
      ]
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(50);

    // Filter out dismissed notifications
    const activeNotifications = notifications.filter(notif =>
      !notif.isDismissedBy(userId)
    );

    // Mark unread count
    const unreadCount = activeNotifications.filter(notif =>
      !notif.isReadBy(userId)
    ).length;

    res.json({
      success: true,
      notifications: activeNotifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user notifications',
      error: error.message
    });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const [total, active, scheduled, inactive, expired] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ status: 'active' }),
      Notification.countDocuments({ status: 'scheduled' }),
      Notification.countDocuments({ status: 'inactive' }),
      Notification.countDocuments({ status: 'expired' })
    ]);

    // Get total views and clicks
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewCount' },
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        scheduled,
        inactive,
        expired,
        totalViews: stats[0]?.totalViews || 0,
        totalClicks: stats[0]?.totalClicks || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get single notification
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

// Create notification
export const createNotification = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const userName = req.user?.name || req.user?.email;

    const notificationData = {
      ...req.body,
      createdBy: userId,
      createdByName: userName
    };

    // Auto-set status based on scheduling
    if (req.body.scheduledFor && new Date(req.body.scheduledFor) > new Date()) {
      notificationData.status = 'scheduled';
    }

    const notification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Update notification
export const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Bulk delete notifications
export const bulkDeleteNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No notification IDs provided'
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: ids }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
      error: error.message
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead(userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark notification as dismissed
export const dismissNotification = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsDismissed(userId);

    res.json({
      success: true,
      message: 'Notification dismissed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss notification',
      error: error.message
    });
  }
};

// Track notification click
export const trackClick = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Click tracked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message
    });
  }
};

// Update scheduled notifications (cron job helper)
export const updateScheduledNotifications = async (req, res) => {
  try {
    const now = new Date();

    // Activate scheduled notifications
    const activatedResult = await Notification.updateMany(
      {
        status: 'scheduled',
        scheduledFor: { $lte: now }
      },
      { status: 'active' }
    );

    // Expire notifications
    const expiredResult = await Notification.updateMany(
      {
        status: 'active',
        expiresAt: { $lte: now }
      },
      { status: 'expired' }
    );

    res.json({
      success: true,
      message: 'Scheduled notifications updated',
      activated: activatedResult.modifiedCount,
      expired: expiredResult.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled notifications',
      error: error.message
    });
  }
};
