/**
 * Edit Order Script
 */

'use strict';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editOrderForm');
    const productTableBody = document.getElementById('productTableBody');
    const addProductBtn = document.getElementById('addProductBtn');
    const sameAsShippingCheckbox = document.getElementById('sameAsShipping');
    
    let productIndex = productTableBody.children.length; // Current number of products
    let availableProducts = []; // Will be populated from server

    // Initialize
    init();

    function init() {
        // Load available products for dropdown
        loadAvailableProducts();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial calculation
        calculateTotal();
        
        // Check if billing address is same as shipping
        checkIfBillingSameAsShipping();
    }

    function setupEventListeners() {
        // Form submission
        form.addEventListener('submit', handleFormSubmit);
        
        // Product quantity and price changes
        productTableBody.addEventListener('input', function(e) {
            if (e.target.classList.contains('quantity-input') || e.target.classList.contains('price-input')) {
                updateSubtotal(e.target.closest('tr'));
                calculateTotal();
            }
        });
        
        // Remove product buttons
        productTableBody.addEventListener('click', function(e) {
            if (e.target.closest('.remove-product')) {
                removeProduct(e.target.closest('tr'));
            }
        });
        
        // Add product button
        addProductBtn.addEventListener('click', showAddProductModal);
        
        // Same as shipping checkbox
        sameAsShippingCheckbox.addEventListener('change', handleSameAsShippingChange);
        
        // Address field changes for auto-sync
        ['shipping_street', 'shipping_city', 'shipping_postal_code', 'shipping_country'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', function() {
                    if (sameAsShippingCheckbox.checked) {
                        syncBillingAddress();
                    }
                });
            }
        });
    }

    async function loadAvailableProducts() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                availableProducts = await response.json();
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function updateSubtotal(row) {
        const quantityInput = row.querySelector('.quantity-input');
        const priceInput = row.querySelector('.price-input');
        const subtotalCell = row.querySelector('.subtotal');
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const subtotal = quantity * price;
        
        subtotalCell.textContent = '$' + subtotal.toFixed(2);
    }

    function calculateTotal() {
        let total = 0;
        const subtotalCells = productTableBody.querySelectorAll('.subtotal');
        
        subtotalCells.forEach(cell => {
            const amount = parseFloat(cell.textContent.replace('$', '')) || 0;
            total += amount;
        });
        
        // Update both the display and hidden field
        const totalDisplay = document.getElementById('totalAmount');
        const totalInput = document.getElementById('total_price');
        
        if (totalDisplay) {
            totalDisplay.textContent = '$' + total.toFixed(2);
        }
        if (totalInput) {
            totalInput.value = total.toFixed(2);
        }
    }

    function removeProduct(row) {
        Swal.fire({
            title: 'Remove Product?',
            text: 'Are you sure you want to remove this product from the order?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                row.remove();
                reindexProducts();
                calculateTotal();
                
                Swal.fire({
                    title: 'Removed!',
                    text: 'Product has been removed from the order.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    function reindexProducts() {
        const rows = productTableBody.querySelectorAll('.product-row');
        rows.forEach((row, index) => {
            row.setAttribute('data-index', index);
            
            // Update input names
            const inputs = row.querySelectorAll('input[name*="products"]');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                const newName = name.replace(/\[\d+\]/, `[${index}]`);
                input.setAttribute('name', newName);
            });
        });
        productIndex = rows.length;
    }

    function showAddProductModal() {
        if (availableProducts.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Products Available',
                text: 'Please add products to the system first.'
            });
            return;
        }

        const productOptions = availableProducts.map(product => 
            `<option value="${product._id}" data-price="${product.productPrice}">${product.productTitle} - $${product.productPrice}</option>`
        ).join('');

        Swal.fire({
            title: 'Add Product to Order',
            html: `
                <div class="mb-3">
                    <label for="swal-product" class="form-label">Select Product:</label>
                    <select id="swal-product" class="form-select">
                        <option value="">Choose a product...</option>
                        ${productOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="swal-quantity" class="form-label">Quantity:</label>
                    <input type="number" id="swal-quantity" class="form-control" value="1" min="1">
                </div>
                <div class="mb-3">
                    <label for="swal-price" class="form-label">Unit Price:</label>
                    <input type="number" id="swal-price" class="form-control" step="0.01" min="0">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Add Product',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const productId = document.getElementById('swal-product').value;
                const quantity = document.getElementById('swal-quantity').value;
                const price = document.getElementById('swal-price').value;

                if (!productId || !quantity || !price) {
                    Swal.showValidationMessage('Please fill in all fields');
                    return false;
                }

                return { productId, quantity: parseFloat(quantity), price: parseFloat(price) };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                addProductToTable(result.value);
            }
        });

        // Auto-fill price when product is selected
        document.getElementById('swal-product').addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            if (price) {
                document.getElementById('swal-price').value = price;
            }
        });
    }

    function addProductToTable({ productId, quantity, price }) {
        const product = availableProducts.find(p => p._id === productId);
        if (!product) return;

        const subtotal = quantity * price;
        const row = document.createElement('tr');
        row.className = 'product-row';
        row.setAttribute('data-index', productIndex);

        row.innerHTML = `
            <td>
                <div class="d-flex flex-column">
                    <h6 class="mb-1">${product.productTitle}</h6>
                    <small class="text-muted">Product ID: ${product._id}</small>
                    <input type="hidden" name="products[${productIndex}][product_id]" value="${product._id}">
                </div>
            </td>
            <td class="text-center">
                <input type="number" class="form-control text-center quantity-input" 
                       name="products[${productIndex}][quantity]" 
                       value="${quantity}" 
                       min="1" style="width: 80px; margin: 0 auto;">
            </td>
            <td class="text-end">
                <div class="input-group" style="width: 120px; margin-left: auto;">
                    <span class="input-group-text">$</span>
                    <input type="number" class="form-control text-end price-input" 
                           name="products[${productIndex}][unit_price]" 
                           value="${price}" 
                           step="0.01" min="0">
                </div>
            </td>
            <td class="text-end subtotal">$${subtotal.toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger remove-product" title="Remove Product">
                    <i class="ri ri-delete-bin-line"></i>
                </button>
            </td>
        `;

        productTableBody.appendChild(row);
        productIndex++;
        calculateTotal();
    }

    function checkIfBillingSameAsShipping() {
        const shippingStreet = document.getElementById('shipping_street').value;
        const billingStreet = document.getElementById('billing_street').value;
        const shippingCity = document.getElementById('shipping_city').value;
        const billingCity = document.getElementById('billing_city').value;
        
        if (shippingStreet === billingStreet && shippingCity === billingCity) {
            sameAsShippingCheckbox.checked = true;
            handleSameAsShippingChange();
        }
    }

    function handleSameAsShippingChange() {
        const billingFields = document.getElementById('billingAddressFields');
        
        if (sameAsShippingCheckbox.checked) {
            billingFields.style.display = 'none';
            syncBillingAddress();
        } else {
            billingFields.style.display = 'block';
        }
    }

    function syncBillingAddress() {
        if (sameAsShippingCheckbox.checked) {
            document.getElementById('billing_street').value = document.getElementById('shipping_street').value;
            document.getElementById('billing_city').value = document.getElementById('shipping_city').value;
            document.getElementById('billing_postal_code').value = document.getElementById('shipping_postal_code').value;
            document.getElementById('billing_country').value = document.getElementById('shipping_country').value;
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Updating Order...',
            text: 'Please wait while we update the order',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Collect form data
            const formData = new FormData(form);
            const orderData = {};
            
            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                if (key.includes('[') && key.includes(']')) {
                    // Handle nested objects (products, addresses)
                    const matches = key.match(/^(.+?)\[(.+?)\](?:\[(.+?)\])?$/);
                    if (matches) {
                        const [, mainKey, subKey, subSubKey] = matches;
                        
                        if (!orderData[mainKey]) {
                            orderData[mainKey] = mainKey === 'products' ? [] : {};
                        }
                        
                        if (mainKey === 'products') {
                            const index = parseInt(subKey);
                            if (!orderData[mainKey][index]) {
                                orderData[mainKey][index] = {};
                            }
                            orderData[mainKey][index][subSubKey] = value;
                        } else {
                            orderData[mainKey][subKey] = value;
                        }
                    }
                } else {
                    orderData[key] = value;
                }
            }

            // Map field names to backend expected names
            const mappedData = {
                status: formData.get('status'),
                payment_status: formData.get('payment_status'),
                payment_method: formData.get('payment_method'),
                products: orderData.products || [],
                total_price: parseFloat(formData.get('total_price')) || parseFloat(document.getElementById('totalAmount').textContent.replace('$', '')) || 0,
                shipping_address: {
                    street: formData.get('shipping_address[street]'),
                    city: formData.get('shipping_address[city]'),
                    postal_code: formData.get('shipping_address[postal_code]'),
                    country: formData.get('shipping_address[country]')
                },
                billing_address: sameAsShippingCheckbox.checked ? {
                    street: formData.get('shipping_address[street]'),
                    city: formData.get('shipping_address[city]'),
                    postal_code: formData.get('shipping_address[postal_code]'),
                    country: formData.get('shipping_address[country]')
                } : {
                    street: formData.get('billing_address[street]'),
                    city: formData.get('billing_address[city]'),
                    postal_code: formData.get('billing_address[postal_code]'),
                    country: formData.get('billing_address[country]')
                },
                notes: formData.get('order_notes')
            };

            const orderId = formData.get('order_id');

            // Send update request
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mappedData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Updated Successfully!',
                    text: 'The order has been updated successfully.',
                    confirmButtonText: 'View Orders'
                }).then(() => {
                    window.location.href = '/view-orders';
                });
            } else {
                throw new Error(result.message || 'Failed to update order');
            }

        } catch (error) {
            console.error('Error updating order:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.message || 'Failed to update order. Please try again.'
            });
        }
    }

    function validateForm() {
        // Check if at least one product exists
        if (productTableBody.children.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Products',
                text: 'Please add at least one product to the order.'
            });
            return false;
        }

        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Required Field',
                    text: 'Please fill in all required fields.'
                });
                return false;
            }
        }

        return true;
    }
});
