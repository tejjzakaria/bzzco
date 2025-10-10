import SellerApplication from '../models/seller-application.model.js';
import auth0Client from '../config/auth0.config.js';
import { generatePassword } from '../utils/password-generator.js';
import dotenv from 'dotenv';

dotenv.config();

// Get all seller applications with stats
export const getAllSellerApplications = async (req, res) => {
  try {
    const applications = await SellerApplication.find()
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller applications',
      error: error.message
    });
  }
};

// Get statistics for seller applications
export const getSellerApplicationStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, underReview] = await Promise.all([
      SellerApplication.countDocuments(),
      SellerApplication.countDocuments({ status: 'pending' }),
      SellerApplication.countDocuments({ status: 'approved' }),
      SellerApplication.countDocuments({ status: 'rejected' }),
      SellerApplication.countDocuments({ status: 'under-review' })
    ]);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
        underReview
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

// Get single seller application by ID
export const getSellerApplicationById = async (req, res) => {
  try {
    const application = await SellerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Update application status (approve/reject)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, approvalNotes } = req.body;

    // First, get the application
    const application = await SellerApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const updateData = {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user?._id || null
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (status === 'approved' && approvalNotes) {
      updateData.approvalNotes = approvalNotes;
    }

    // If approving and account not yet created, create Auth0 account
    if (status === 'approved' && !application.auth0UserId) {
      try {
        // Generate a secure password
        const generatedPassword = generatePassword(12);

        // Create Auth0 user account
        const auth0User = await auth0Client.users.create({
          connection: process.env.AUTH0_CONNECTION,
          email: application.email,
          password: generatedPassword,
          name: application.ownerName,
          user_metadata: {
            role: 'seller',
            shopName: application.shopName,
            phone: application.phone
          },
          app_metadata: {
            role: 'seller',
            shopName: application.shopName,
            applicationId: id
          }
        });

        // Store Auth0 user ID and password in application
        updateData.auth0UserId = auth0User.data?.user_id || auth0User.user_id;
        updateData.generatedPassword = generatedPassword; // Store temporarily
        updateData.accountCreatedAt = new Date();

      } catch (auth0Error) {
        // If Auth0 account creation fails, don't approve the application
        return res.status(500).json({
          success: false,
          message: 'Failed to create seller account in Auth0',
          error: auth0Error.message || 'Auth0 error'
        });
      }
    }

    // Update the application
    const updatedApplication = await SellerApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Prepare response with credentials if account was created
    const response = {
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication
    };

    // If account was created, include credentials in response
    if (status === 'approved' && updatedApplication.auth0UserId && updatedApplication.generatedPassword) {
      response.credentials = {
        email: updatedApplication.email,
        password: updatedApplication.generatedPassword,
        role: 'seller'
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// Delete seller application
export const deleteSellerApplication = async (req, res) => {
  try {
    const application = await SellerApplication.findByIdAndDelete(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

// Bulk delete seller applications
export const bulkDeleteApplications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No application IDs provided'
      });
    }

    const result = await SellerApplication.deleteMany({
      _id: { $in: ids }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} application(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete applications',
      error: error.message
    });
  }
};

// Update application details
export const updateSellerApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow direct status updates through this endpoint
    delete updateData.status;
    delete updateData.reviewedAt;
    delete updateData.reviewedBy;

    const application = await SellerApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};
