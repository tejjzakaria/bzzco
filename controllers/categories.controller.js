import Category from "../models/categories.model.js";

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({});
        
        // Calculate summary statistics
        const totalCategories = categories.length;
        const activeCategories = categories.filter(cat => cat.status === 'active').length;
        const inactiveCategories = categories.filter(cat => cat.status === 'inactive').length;
        const activePercentage = totalCategories > 0 ? Math.round((activeCategories / totalCategories) * 100) : 0;
        const inactivePercentage = totalCategories > 0 ? Math.round((inactiveCategories / totalCategories) * 100) : 0;
        
        const stats = {
            total: totalCategories,
            active: activeCategories,
            inactive: inactiveCategories,
            activePercentage,
            inactivePercentage
        };
        
        res.render('view-categories', { 
            currentPage: 'view-categories',
            categories: categories,
            stats: stats
        });
    } catch (error) {
        console.log("ERROR FETCHING CATEGORIES", error);
        res.render('view-categories', { 
            currentPage: 'view-categories',
            categories: [],
            stats: {
                total: 0,
                active: 0,
                inactive: 0,
                activePercentage: 0,
                inactivePercentage: 0
            }
        });
    }
};

const addCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const newCategory = new Category({
            name,
            description,
            status
        });

        await newCategory.save();
        res.status(201).json({
            success: true,
            message: "Category added successfully", category: newCategory 
        });
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const updateCategory = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, status },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.json({ success: true, message: "Category updated successfully", category: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false, message: "Failed to update category" });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, message: "Failed to delete category" });
    }
};


const deleteBulkCategories = async (req, res) => {
    try {
        const { categoryIds } = req.body;

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide category IDs to delete" });
        }

        const result = await Category.deleteMany({ _id: { $in: categoryIds } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "No categories found to delete" });
        }

        res.json({
            success: true,
            message: `${result.deletedCount} category(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error bulk deleting categories:", error);
        res.status(500).json({ success: false, message: "Failed to delete categories" });
    }
};

const getCategoriesForDataTable = async (req, res) => {
    try {
        const categories = await Category.find({}).lean();
        res.json({
            data: categories.map(category => ({
                _id: category._id,
                name: category.name,
                description: category.description,
                status: category.status
            }))
        });
    } catch (error) {
        console.error("Error fetching categories for DataTable:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        res.json({ success: true, category });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ success: false, message: "Failed to fetch category" });
    }
};

export { 
    getAllCategories, 
    addCategory, 
    updateCategory, 
    deleteCategory, 
    deleteBulkCategories,
    getCategoriesForDataTable,
    getCategoryById
};

