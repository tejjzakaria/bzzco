import express from 'express';
import Seller from '../models/sellers.model.js';
import { addSeller, getAllSellers } from '../controllers/sellers.controller.js';

const router = express.Router();

// View sellers route
router.get('/view-sellers', async (req, res) => {
    try {
        // Calculate statistics for the dashboard cards
        const sellers = await Seller.find({});
        const totalSellers = sellers.length;
        const planCounts = sellers.reduce((acc, seller) => {
            acc[seller.plan] = (acc[seller.plan] || 0) + 1;
            return acc;
        }, {});
        
        const stats = {
            total: totalSellers,
            planA: planCounts['Plan A'] || 0,
            planB: planCounts['Plan B'] || 0,
            planC: planCounts['Plan C'] || 0,
            planD: planCounts['Plan D'] || 0
        };
        
        res.render('view-sellers', { 
            currentPage: 'view-sellers',
            stats: stats
        });
    } catch (error) {
        console.log("ERROR FETCHING SELLER STATS", error);
        res.render('view-sellers', { 
            currentPage: 'view-sellers',
            stats: { total: 0, planA: 0, planB: 0, planC: 0, planD: 0 }
        });
    }
});

// -- Sellers API Routes --
// Get all sellers API
router.get("/api/sellers", getAllSellers);


// Get single seller API
router.get("/api/sellers/:id", async (req, res) => {
    try {
        const seller = await Seller.findById(req.params.id);
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }
        res.json({ success: true, seller });
    } catch (error) {
        console.error("Error fetching seller:", error);
        res.status(500).json({ success: false, message: "Failed to fetch seller" });
    }
});

// Create seller API (for AJAX calls)
router.post("/api/sellers", async (req, res) => {
    try {
        const { full_name, email, phone_number, company, country, plan } = req.body;

        const seller = new Seller({
            full_name,
            email,
            phone_number,
            company,
            country,
            plan
        });
        
        await seller.save();
        res.json({ success: true, message: "Seller added successfully", seller });
    } catch (error) {
        console.error("Error adding seller:", error);
        res.status(500).json({ success: false, message: "Failed to add seller" });
    }
});

// Update seller API
router.put("/api/sellers/:id", async (req, res) => {
    try {
        const { full_name, email, phone_number, company, country, plan } = req.body;

        const seller = await Seller.findByIdAndUpdate(
            req.params.id,
            { full_name, email, phone_number, company, country, plan },
            { new: true, runValidators: true }
        );
        
        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        res.json({ success: true, message: "Seller updated successfully", seller });
    } catch (error) {
        console.error("Error updating seller:", error);
        res.status(500).json({ success: false, message: "Failed to update seller" });
    }
});

// Bulk delete sellers API (must come before :id route)
router.delete("/api/sellers/bulk/delete", async (req, res) => {
    try {
        const { sellerIds } = req.body;
        
        if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide seller IDs to delete" });
        }
        
        const result = await Seller.deleteMany({ _id: { $in: sellerIds } });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "No sellers found to delete" });
        }
        
        res.json({ 
            success: true, 
            message: `${result.deletedCount} seller(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting sellers:", error);
        res.status(500).json({ success: false, message: "Failed to delete sellers" });
    }
});

// Delete seller API
router.delete("/api/sellers/:id", async (req, res) => {
    try {
        const seller = await Seller.findByIdAndDelete(req.params.id);

        if (!seller) {
            return res.status(404).json({ success: false, message: "Seller not found" });
        }

        res.json({ success: true, message: "Seller deleted successfully" });
    } catch (error) {
        console.error("Error deleting seller:", error);
        res.status(500).json({ success: false, message: "Failed to delete seller" });
    }
});

// Add seller (form submission)
router.post("/add-seller", addSeller);

export default router;
