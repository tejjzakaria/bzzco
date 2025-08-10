import Product from "../models/products.model.js";

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    // DataTables expects data in this format
    res.json({ data: products });
  } catch (error) {
    console.log("ERROR FETCHING PRODUCTS", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      productTitle,
      description,
      productSku,
      productBarcode,
      images,
      variants,
      quantity,
      inStock,
      shippingType,
      globalDelivery,
      selectedCountries,
      attributes,
      productIdType,
      productId,
      productPrice,
      productDiscountedPrice,
      chargeTax,
      vendor,
      category,
      status,
      tags,
      weight,
      manufacturer,
      dimensions
    } = req.body;

    console.log('Received inStock:', inStock, 'type:', typeof inStock);
    console.log('Received chargeTax:', chargeTax, 'type:', typeof chargeTax);
    console.log('Received variants (raw):', variants, 'type:', typeof variants);

    // Handle variants - parse if it's a JSON string
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        console.log('Parsed variants:', parsedVariants); // Debug log
      } catch (e) {
        console.log('Error parsing variants:', e);
        parsedVariants = [];
      }
    } else {
      console.log('No variants provided'); // Debug log
    }

    // Handle tags - parse if it's a JSON string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        console.log('Error parsing tags:', e);
        parsedTags = [];
      }
    }

    // Handle selectedCountries - parse if it's a JSON string
    let parsedSelectedCountries = [];
    if (selectedCountries) {
      try {
        parsedSelectedCountries = typeof selectedCountries === 'string' ? JSON.parse(selectedCountries) : selectedCountries;
        console.log('Parsed selectedCountries:', parsedSelectedCountries); // Debug log
      } catch (e) {
        console.log('Error parsing selectedCountries:', e);
        parsedSelectedCountries = [];
      }
    }

    // Validate required fields
    if (!productTitle || !productSku || !productPrice || !category) {
      return res.status(400).json({ 
        error: "Missing required fields: productTitle, productSku, productPrice, and category are required" 
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ productSku });
    if (existingProduct) {
      return res.status(400).json({ 
        error: "Product with this SKU already exists" 
      });
    }

    // Create new product
    const newProduct = new Product({
      productTitle,
      description,
      productSku,
      productBarcode,
      images: images || [],
      variants: parsedVariants || [],
      quantity: quantity || 0,
      inStock: (inStock === 'true' || inStock === true || inStock === 'yes') ? 'yes' : 'no',
      shippingType: shippingType || 'company',
      globalDelivery: globalDelivery || 'local',
      selectedCountries: parsedSelectedCountries || [],
      attributes: {
        fragile: attributes?.fragile || false,
        biodegradable: attributes?.biodegradable || false,
        frozen: attributes?.frozen || false,
        maxTemperature: attributes?.maxTemperature,
        hasExpiryDate: attributes?.hasExpiryDate || false,
        expiryDate: attributes?.expiryDate
      },
      productIdType,
      productId,
      productPrice: parseFloat(productPrice),
      productDiscountedPrice: productDiscountedPrice ? parseFloat(productDiscountedPrice) : undefined,
      chargeTax: (chargeTax === 'true' || chargeTax === true || chargeTax === 'yes') ? 'yes' : 'no',
      vendor,
      category,
      status: status || 'Published',
      tags: parsedTags || [],
      weight,
      manufacturer,
      dimensions
    });

    console.log('Product to be saved:', {
      ...newProduct.toObject(),
      variants: newProduct.variants
    });

    console.log('=== PRODUCT SAVE ATTEMPT ===');
    console.log('Product data being saved:');
    console.log('- productTitle:', newProduct.productTitle);
    console.log('- productSku:', newProduct.productSku);
    console.log('- productPrice:', newProduct.productPrice);
    console.log('- category:', newProduct.category);
    console.log('- inStock:', newProduct.inStock);
    console.log('- chargeTax:', newProduct.chargeTax);
    console.log('- variants:', JSON.stringify(newProduct.variants, null, 2));
    console.log('================================');

    const savedProduct = await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });

  } catch (error) {
    console.log("ERROR CREATING PRODUCT", error);
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      console.log("Validation errors details:");
      Object.keys(error.errors).forEach(key => {
        console.log(`- ${key}: ${error.errors[key].message}`);
      });
      
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors,
        fieldErrors: error.errors
      });
    }

    // Handle duplicate key error (SKU)
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: "Product with this SKU already exists" 
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.log("ERROR FETCHING PRODUCT", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('=== UPDATE PRODUCT REQUEST ===');
    console.log('Product ID:', id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('===============================');
    
    const {
      productTitle,
      description,
      productSku,
      productBarcode,
      productPrice,
      productDiscountedPrice,
      quantity,
      weight,
      manufacturer,
      dimensions,
      category,
      status,
      inStock,
      chargeTax,
      tags,
      variants,
      existingImages,
      shippingType,
      globalDelivery,
      selectedCountries,
      attributes,
      productIdType,
      productIdNumber,
      vendor
    } = req.body;

    console.log('inStock value:', inStock, 'type:', typeof inStock);
    console.log('chargeTax value:', chargeTax, 'type:', typeof chargeTax);
    
    // Apply conversion as safety net
    const safeInStock = (inStock === 'true' || inStock === true || inStock === 'yes') ? 'yes' : 'no';
    const safeChargeTax = (chargeTax === 'true' || chargeTax === true || chargeTax === 'yes') ? 'yes' : 'no';
    
    console.log('Converted inStock:', safeInStock);
    console.log('Converted chargeTax:', safeChargeTax);

    // Find the existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Handle images
    let updatedImages = [];
    
    // Add existing images (not removed)
    if (existingImages) {
      try {
        updatedImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        console.log('Parsed existing images:', updatedImages);
      } catch (e) {
        console.log('Error parsing existing images:', e);
        updatedImages = [];
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);
      updatedImages = [...updatedImages, ...newImageUrls];
      console.log('Added new images:', newImageUrls);
    }

    // Handle tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        console.log('Parsed tags:', parsedTags);
      } catch (e) {
        console.log('Error parsing tags:', e);
        parsedTags = [];
      }
    }

    // Handle variants
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        console.log('Parsed variants:', parsedVariants);
      } catch (e) {
        console.log('Error parsing variants:', e);
        parsedVariants = [];
      }
    }

    // Handle selectedCountries
    let parsedSelectedCountries = [];
    if (selectedCountries) {
      try {
        parsedSelectedCountries = typeof selectedCountries === 'string' ? JSON.parse(selectedCountries) : selectedCountries;
        console.log('Parsed selected countries:', parsedSelectedCountries);
      } catch (e) {
        console.log('Error parsing selected countries:', e);
        parsedSelectedCountries = [];
      }
    }

    // Handle attributes
    let parsedAttributes = {};
    if (attributes) {
      try {
        parsedAttributes = typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
        console.log('Parsed attributes:', parsedAttributes);
      } catch (e) {
        console.log('Error parsing attributes:', e);
        parsedAttributes = {};
      }
    }

    // Check for SKU conflicts if SKU is being changed
    if (productSku && productSku !== existingProduct.productSku) {
      const skuConflict = await Product.findOne({ 
        productSku: productSku,
        _id: { $ne: id } // Exclude current product
      });
      if (skuConflict) {
        return res.status(400).json({ 
          success: false,
          message: "Product with this SKU already exists" 
        });
      }
    }

    // Validate required fields
    if (!productTitle || !productSku || !category) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ 
            success: false,
            message: "Missing required fields: productTitle, productSku, and category are required" 
        });
    }

    // Construct update data object
    const updateData = {
      productTitle,
      description,
      productBarcode,
      productPrice: parseFloat(productPrice),
      productDiscountedPrice: productDiscountedPrice ? parseFloat(productDiscountedPrice) : undefined,
      quantity: parseInt(quantity) || 0,
      weight: parseFloat(weight) || undefined,
      manufacturer,
      dimensions,
      category,
      status: status || 'Published',
      inStock: safeInStock,
      chargeTax: safeChargeTax,
      tags: parsedTags,
      variants: parsedVariants,
      images: updatedImages,
      shippingType: shippingType || 'company',
      globalDelivery: globalDelivery || 'local',
      selectedCountries: parsedSelectedCountries,
      attributes: {
        fragile: parsedAttributes.fragile || false,
        biodegradable: parsedAttributes.biodegradable || false,
        frozen: parsedAttributes.frozen || false,
        maxTemperature: parsedAttributes.maxTemperature,
        hasExpiryDate: parsedAttributes.hasExpiryDate || false,
        expiryDate: parsedAttributes.expiryDate
      },
      productIdType,
      productId: productIdNumber,
      vendor
    };

    // Only include productSku if it's actually changing to avoid unique constraint issues
    if (productSku && productSku !== existingProduct.productSku) {
      updateData.productSku = productSku;
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    console.log('Update data object:', updateData);

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedProduct) {
        console.log('Product not found during update');
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    console.log('Product updated successfully:', updatedProduct);

    res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct
    });

  } catch (error) {
        console.log("ERROR UPDATING PRODUCT", error);
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("Error stack:", error.stack);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            console.log("Validation errors details:");
            Object.keys(error.errors).forEach(key => {
                console.log(`- ${key}: ${error.errors[key].message}`);
            });

            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                message: "Validation failed", 
                details: validationErrors,
                fieldErrors: error.errors
            });
        }

        // Handle duplicate key error (SKU)
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                message: "Product with this SKU already exists" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Failed to update product",
            error: error.message,
            details: error.stack
        });
    }
};

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['Published', 'Scheduled', 'Inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be Published, Scheduled, or Inactive" 
      });
    }
    
    const product = await Product.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.json({ 
      success: true, 
      message: `Product status updated to ${status}`,
      product 
    });
  } catch (error) {
    console.log("ERROR UPDATING PRODUCT STATUS", error);
    res.status(500).json({ success: false, message: "Failed to update product status" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Product deleted successfully" 
    });
  } catch (error) {
    console.log("ERROR DELETING PRODUCT", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};

// Add new function to get product statistics
const getProductStats = async (req, res) => {
  try {
    console.log("=== PRODUCT STATS REQUEST STARTED ===");
    
    // Get total product count
    console.log("Fetching total products count...");
    const totalProducts = await Product.countDocuments();
    console.log("Total products:", totalProducts);
    
    // Get published products count
    console.log("Fetching published products count...");
    const publishedProducts = await Product.countDocuments({ status: 'Published' });
    console.log("Published products:", publishedProducts);
    
    // Get products in stock count
    console.log("Fetching in-stock products count...");
    const inStockProducts = await Product.countDocuments({ inStock: 'yes' });
    console.log("In-stock products:", inStockProducts);
    
    // Get low stock products (quantity <= 10)
    console.log("Fetching low stock products count...");
    const lowStockProducts = await Product.countDocuments({ 
      quantity: { $lte: 10 }, 
      inStock: 'yes' 
    });
    console.log("Low stock products:", lowStockProducts);
    
    // Calculate total inventory value
    console.log("Calculating inventory value...");
    const inventoryValueResult = await Product.aggregate([
      { $match: { status: 'Published', inStock: 'yes' } },
      { 
        $group: { 
          _id: null, 
          totalValue: { 
            $sum: { 
              $multiply: ['$productPrice', '$quantity'] 
            } 
          } 
        } 
      }
    ]);
    
    const totalInventoryValue = inventoryValueResult.length > 0 ? inventoryValueResult[0].totalValue : 0;
    console.log("Total inventory value:", totalInventoryValue);
    
    // Get category distribution
    console.log("Fetching category stats...");
    const categoryStats = await Product.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    console.log("Category stats:", categoryStats);
    
    const statsResponse = {
      success: true,
      stats: {
        totalProducts,
        publishedProducts,
        inStockProducts,
        lowStockProducts,
        totalInventoryValue,
        categoryStats
      }
    };
    
    console.log("=== PRODUCT STATS RESPONSE ===", statsResponse);
    res.json(statsResponse);
  } catch (error) {
    console.log("ERROR FETCHING PRODUCT STATS", error);
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch product stats",
      error: error.message 
    });
  }
};

export { getAllProducts, addProduct, getProductById, updateProduct, updateProductStatus, deleteProduct, getProductStats };

