import Product from '../models/products.model.js';
import Customer from '../models/customers.model.js';
import Seller from '../models/sellers.model.js';
import Merchant from '../models/merchants.model.js';
import Order from '../models/orders.model.js';
import Category from '../models/categories.model.js';
import NewsletterSubscriber from '../models/newsletter.model.js';
import ContactMessage from '../models/contact.model.js';
import JobApplication from '../models/jobApplication.model.js';
import Team from '../models/team.model.js';
import Slider from '../models/slider.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalSellers,
      totalMerchants,
      totalOrders,
      totalCategories,
      totalNewsletter,
      totalContacts,
      totalJobApplications,
      totalTeam,
      totalSliders
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Seller.countDocuments(),
      Merchant.countDocuments(),
      Order.countDocuments(),
      Category.countDocuments(),
      NewsletterSubscriber.countDocuments(),
      ContactMessage.countDocuments(),
      JobApplication.countDocuments(),
      Team.countDocuments(),
      Slider.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        totalSellers,
        totalMerchants,
        totalOrders,
        totalCategories,
        totalNewsletter,
        totalContacts,
        totalJobApplications,
        totalTeam,
        totalSliders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
