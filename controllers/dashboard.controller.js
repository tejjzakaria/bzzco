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
import Page from '../models/pages.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Get current date and dates for time-based queries
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get basic counts
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
      totalSliders,
      totalPages,

      // Recent activity
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      customersThisMonth,

      // Order analytics
      pendingOrders,
      completedOrders,
      paidOrders,
      unpaidOrders,

      // Product stats
      activeProducts,
      outOfStockProducts,

      // Revenue calculation
      ordersWithRevenue
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
      Slider.countDocuments(),
      Page.countDocuments(),

      // Recent activity
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Customer.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Order analytics
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Completed' }),
      Order.countDocuments({ payment_status: 'Paid' }),
      Order.countDocuments({ payment_status: 'Unpaid' }),

      // Product stats
      Product.countDocuments({ stock_quantity: { $gt: 0 } }),
      Product.countDocuments({ stock_quantity: 0 }),

      // Revenue
      Order.find({ payment_status: 'Paid' }).select('total_price')
    ]);

    // Calculate total revenue
    const totalRevenue = ordersWithRevenue.reduce((sum, order) => sum + (order.total_price || 0), 0);

    // Get monthly revenue for the last 6 months
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          payment_status: 'Paid',
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$total_price' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get orders by status for chart
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product_id',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: '$products.total_price' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
    ]);

    res.json({
      success: true,
      stats: {
        // Basic counts
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
        totalSliders,
        totalPages,

        // Activity metrics
        ordersToday,
        ordersThisWeek,
        ordersThisMonth,
        customersThisMonth,

        // Order metrics
        pendingOrders,
        completedOrders,
        paidOrders,
        unpaidOrders,

        // Product metrics
        activeProducts,
        outOfStockProducts,

        // Financial
        totalRevenue: totalRevenue.toFixed(2),
        monthlyRevenue,

        // Charts data
        ordersByStatus,
        topProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
