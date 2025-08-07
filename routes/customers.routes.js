import express from 'express';
import Customer from '../models/customers.model.js';
import { addCustomer, getAllCustomers } from '../controllers/customers.controller.js';

const router = express.Router();

// View customers route
router.get('/view-customers', async (req, res) => {
    try {
        // Calculate statistics for the dashboard cards
        const customers = await Customer.find({});
        const totalCustomers = customers.length;
        const planCounts = customers.reduce((acc, customer) => {
            acc[customer.plan] = (acc[customer.plan] || 0) + 1;
            return acc;
        }, {});
        
        const stats = {
            total: totalCustomers,
            planA: planCounts['Plan A'] || 0,
            planB: planCounts['Plan B'] || 0,
            planC: planCounts['Plan C'] || 0,
            planD: planCounts['Plan D'] || 0
        };
        
        res.render('view-customers', { 
            currentPage: 'view-customers',
            stats: stats
        });
    } catch (error) {
        console.log("ERROR FETCHING CUSTOMER STATS", error);
        res.render('view-customers', { 
            currentPage: 'view-customers',
            stats: { total: 0, planA: 0, planB: 0, planC: 0, planD: 0 }
        });
    }
});

// -- Customers API Routes --
// Get all customers API
router.get("/api/customers", getAllCustomers);

// Get single customer API
router.get("/api/customers/:id", async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.json({ success: true, customer });
    } catch (error) {
        console.error("Error fetching customer:", error);
        res.status(500).json({ success: false, message: "Failed to fetch customer" });
    }
});

// Create customer API (for AJAX calls)
router.post("/api/customers", async (req, res) => {
    try {
        const { full_name, email, phone_number, company, country, plan } = req.body;
        
        const customer = new Customer({
            full_name,
            email,
            phone_number,
            company,
            country,
            plan
        });
        
        await customer.save();
        res.json({ success: true, message: "Customer added successfully", customer });
    } catch (error) {
        console.error("Error adding customer:", error);
        res.status(500).json({ success: false, message: "Failed to add customer" });
    }
});

// Update customer API
router.put("/api/customers/:id", async (req, res) => {
    try {
        const { full_name, email, phone_number, company, country, plan } = req.body;
        
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { full_name, email, phone_number, company, country, plan },
            { new: true, runValidators: true }
        );
        
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        
        res.json({ success: true, message: "Customer updated successfully", customer });
    } catch (error) {
        console.error("Error updating customer:", error);
        res.status(500).json({ success: false, message: "Failed to update customer" });
    }
});

// Delete customer API
router.delete("/api/customers/:id", async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        
        res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        res.status(500).json({ success: false, message: "Failed to delete customer" });
    }
});

// Add customer (form submission)
router.post("/add-customer", addCustomer);

export default router;
