import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const sellerApplicationSchema = new Schema({
  // Basic Information
  shopName: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },

  // Business Information
  businessType: {
    type: String,
    required: true,
    enum: ['online', 'brick-and-mortar', 'both']
  },
  businessRegistrationNumber: { type: String, trim: true },
  taxId: { type: String, trim: true },
  yearEstablished: { type: Number, min: 1900, max: new Date().getFullYear() },

  // Address Information
  address: { type: String, required: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'Netherlands' },

  // Business Details
  businessDescription: { type: String, required: true, maxlength: 1000 },
  productCategories: [{ type: String }],
  estimatedMonthlyRevenue: {
    type: String,
    enum: ['0-1000', '1000-5000', '5000-10000', '10000-50000', '50000+']
  },
  numberOfEmployees: {
    type: String,
    enum: ['1', '2-5', '6-10', '11-50', '50+']
  },
  websiteUrl: { type: String, trim: true },

  // Social Media
  socialMedia: {
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },

  // Bank Information
  bankName: { type: String, trim: true },
  accountHolderName: { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  iban: { type: String, trim: true },

  // Status and Approval
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'under-review'],
    default: 'pending'
  },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  approvalNotes: { type: String },

  // Auth0 Account Information (populated when approved)
  auth0UserId: { type: String }, // Auth0 user ID
  generatedPassword: { type: String }, // Temporarily store password (should be sent to seller)
  accountCreatedAt: { type: Date },

  // Additional
  agreementAccepted: { type: Boolean, required: true, default: false },
  verificationDocuments: [{ type: String }]
}, {
  timestamps: true,
  collection: 'seller_applications'
});

// Indexes for faster queries
sellerApplicationSchema.index({ email: 1 });
sellerApplicationSchema.index({ status: 1 });
sellerApplicationSchema.index({ submittedAt: -1 });

const SellerApplication = models.SellerApplication || model('SellerApplication', sellerApplicationSchema);
export default SellerApplication;
