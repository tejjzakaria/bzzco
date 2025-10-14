import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const notificationSchema = new Schema({
  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Notification Type
  type: {
    type: String,
    required: true,
    enum: ['info', 'success', 'warning', 'error', 'announcement'],
    default: 'info'
  },

  // Icon (RemixIcon class)
  icon: {
    type: String,
    default: 'ri-notification-line'
  },

  // Target Audience
  targetAudience: {
    type: String,
    required: true,
    enum: ['all', 'admin', 'seller', 'customer'],
    default: 'all'
  },

  // Link/Action
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled', 'expired'],
    default: 'active'
  },

  // Scheduling
  scheduledFor: {
    type: Date
  },
  expiresAt: {
    type: Date
  },

  // Read Tracking (users who have read this notification)
  readBy: [{
    userId: { type: String }, // Auth0 user ID
    readAt: { type: Date, default: Date.now }
  }],

  // Dismissal Tracking (users who have dismissed/closed this notification)
  dismissedBy: [{
    userId: { type: String },
    dismissedAt: { type: Date, default: Date.now }
  }],

  // Creator Info
  createdBy: {
    type: String, // Auth0 user ID
    required: true
  },
  createdByName: {
    type: String
  },

  // Statistics
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Indexes for better query performance
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ targetAudience: 1, status: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'readBy.userId': 1 });

// Virtual field to check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to check if user has read this notification
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.userId === userId);
};

// Method to check if user has dismissed this notification
notificationSchema.methods.isDismissedBy = function(userId) {
  return this.dismissedBy.some(dismiss => dismiss.userId === userId);
};

// Method to mark as read by user
notificationSchema.methods.markAsRead = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({ userId, readAt: new Date() });
    this.viewCount += 1;
  }
  return this.save();
};

// Method to mark as dismissed by user
notificationSchema.methods.markAsDismissed = function(userId) {
  if (!this.isDismissedBy(userId)) {
    this.dismissedBy.push({ userId, dismissedAt: new Date() });
  }
  return this.save();
};

const Notification = models.Notification || model('Notification', notificationSchema);
export default Notification;
