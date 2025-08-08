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
      tags
    } = req.body;

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
      variants: variants || [],
      quantity: quantity || 0,
      inStock: inStock !== undefined ? inStock : true,
      shippingType: shippingType || 'company',
      globalDelivery: globalDelivery || 'local',
      selectedCountries: selectedCountries || [],
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
      chargeTax: chargeTax !== undefined ? chargeTax : true,
      vendor,
      category,
      status: status || 'Published',
      tags: tags || []
    });

    const savedProduct = await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });

  } catch (error) {
    console.log("ERROR CREATING PRODUCT", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: "Validation failed", 
        details: validationErrors 
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
    console.log('Update request body:', req.body);
    
    const {
      productTitle,
      description,
      productSku,
      productPrice,
      quantity,
      weight,
      manufacturer,
      dimensions,
      category,
      status,
      inStock,
      tags,
      variants,
      existingImages
    } = req.body;

    console.log('Extracted category:', category);

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
        updatedImages = JSON.parse(existingImages);
      } catch (e) {
        updatedImages = [];
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/assets/img/products/${file.filename}`);
      updatedImages = [...updatedImages, ...newImageUrls];
    }

    // Handle tags
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = [];
      }
    }

    // Handle variants
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = JSON.parse(variants);
      } catch (e) {
        parsedVariants = [];
      }
    }

    // Prepare update data
    const updateData = {
      productTitle,
      description,
      productSku,
      productPrice: parseFloat(productPrice) || 0,
      quantity: parseInt(quantity) || 0,
      weight,
      manufacturer,
      dimensions,
      category,
      status: status || 'Published',
      inStock: inStock === 'true' || inStock === true,
      tags: parsedTags,
      variants: parsedVariants,
      images: updatedImages,
      updatedAt: new Date()
    };

    console.log('Update data:', updateData);

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.log("ERROR UPDATING PRODUCT", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation failed", 
        details: validationErrors 
      });
    }

    // Handle duplicate key error (SKU)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Product with this SKU already exists" 
      });
    }

    res.status(500).json({ success: false, message: "Failed to update product" });
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

export { getAllProducts, addProduct, getProductById, updateProduct, updateProductStatus, deleteProduct };

