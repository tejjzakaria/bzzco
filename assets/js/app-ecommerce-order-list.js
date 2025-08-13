/**
 * app-ecommerce-order-list Script
 */

'use strict';

// Datatable (js)

document.addEventListener('DOMContentLoaded', function (e) {
  let borderColor, bodyBg, headingColor;

  borderColor = config.colors.borderColor;
  bodyBg = config.colors.bodyBg;
  headingColor = config.colors.headingColor;

  // Variable declaration for table

  const dt_order_table = document.querySelector('.datatables-order'),
    statusObj = {
      1: { title: 'Dispatched', class: 'bg-label-warning' },
      2: { title: 'Delivered', class: 'bg-label-success' },
      3: { title: 'Out for Delivery', class: 'bg-label-primary' },
      4: { title: 'Ready to Pickup', class: 'bg-label-info' }
    },
    paymentObj = {
      1: { title: 'Paid', class: 'text-success' },
      2: { title: 'Pending', class: 'text-warning' },
      3: { title: 'Failed', class: 'text-danger' },
      4: { title: 'Cancelled', class: 'text-secondary' }
    };

  // E-commerce Products datatable

  if (dt_order_table) {
    const dt_products = new DataTable(dt_order_table, {
      ajax: {
        url: '/api/orders', // Use our orders API endpoint
        dataSrc: '' // Since we're returning an array directly
      },
      columns: [
        // columns according to JSON
        { data: '_id' },
        { data: '_id', orderable: false, render: DataTable.render.select() },
        { data: 'order_number' },
        { data: 'createdAt' },
        { data: null }, // customer data (will be handled in columnDefs)
        { data: 'payment_status' },
        { data: 'status' },
        { data: 'payment_method' },
        { data: '_id' }
      ],
      columnDefs: [
        {
          // For Responsive
          className: 'control',
          searchable: false,
          orderable: false,
          responsivePriority: 2,
          targets: 0,
          render: function (data, type, full, meta) {
            return '';
          }
        },
        {
          // For Checkboxes
          targets: 1,
          orderable: false,
          searchable: false,
          responsivePriority: 3,
          checkboxes: true,
          render: function () {
            return '<input type="checkbox" class="dt-checkboxes form-check-input">';
          },
          checkboxes: { selectAllRender: '<input type="checkbox" class="form-check-input">' }
        },
        {
          // Order ID
          targets: 2,
          render: function (data, type, full, meta) {
            const order_number = full['order_number'];
            // Creates full output for row
            const row_output = '<a href="app-ecommerce-order-details.html"><span>#' + order_number + '</span></a>';
            return row_output;
          }
        },
        {
          targets: 3,
          render: function (data, type, full, meta) {
            const date = new Date(full.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            const formattedTime = date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            return `<span class="text-nowrap">${formattedDate}, ${formattedTime}</span>`;
          }
        },
        {
          targets: 4,
          responsivePriority: 1,
          render: function (data, type, full, meta) {
            let name, email;
            
            // Handle both guest and registered customers
            if (full.customer_type === 'guest') {
              name = full.guest_name || 'Guest Customer';
              email = full.guest_email || '';
            } else if (full.customer_id) {
              name = full.customer_id.full_name || 'Unregistered Customer';
              email = full.customer_id.email || '';
            } else {
              name = 'Unregistered Customer';
              email = '';
            }

            // Generate initials for avatar
            const initials = (name.match(/\b\w/g) || []).slice(0, 2).join('').toUpperCase();
            const stateNum = Math.floor(Math.random() * 6);
            const states = ['success', 'danger', 'warning', 'info', 'dark', 'primary', 'secondary'];
            const state = states[stateNum];

            const output = `<span class="avatar-initial rounded-circle bg-label-${state}">${initials}</span>`;

            // Creates full output for row
            const rowOutput = `
              <div class="d-flex justify-content-start align-items-center order-name text-nowrap">
                <div class="avatar-wrapper">
                  <div class="avatar avatar-sm me-3">
                    ${output}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <h6 class="m-0">${name}</h6>
                  <small>${email}</small>
                </div>
              </div>`;

            return rowOutput;
          }
        },
        {
          targets: 5,
          render: function (data, type, full, meta) {
            const payment_status = full['payment_status'];
            let statusClass = 'text-secondary';
            let statusIcon = 'ri-circle-fill';
            
            // Map payment status to appropriate styling
            switch(payment_status?.toLowerCase()) {
              case 'paid':
                statusClass = 'text-success';
                break;
              case 'unpaid':
              case 'pending':
                statusClass = 'text-warning';
                break;
              case 'failed':
                statusClass = 'text-danger';
                break;
              case 'cancelled':
              case 'refunded':
                statusClass = 'text-secondary';
                break;
              default:
                statusClass = 'text-muted';
            }
            
            return `
              <h6 class="mb-0 align-items-center d-flex w-px-100 ${statusClass}">
                <i class="icon-base ${statusIcon} icon-10px me-1"></i>${payment_status || 'Unknown'}
              </h6>`;
          }
        },
        {
          targets: -3,
          render: function (data, type, full, meta) {
            const status = full['status'];
            let statusClass = 'bg-label-secondary';
            
            // Map order status to appropriate styling
            switch(status?.toLowerCase()) {
              case 'pending':
                statusClass = 'bg-label-warning';
                break;
              case 'processing':
                statusClass = 'bg-label-info';
                break;
              case 'shipped':
              case 'dispatched':
                statusClass = 'bg-label-primary';
                break;
              case 'delivered':
                statusClass = 'bg-label-success';
                break;
              case 'cancelled':
                statusClass = 'bg-label-danger';
                break;
              default:
                statusClass = 'bg-label-secondary';
            }
            
            return `
              <span class="badge rounded-pill px-2 ${statusClass} text-capitalized">
                ${status || 'Unknown'}
              </span>`;
          }
        },
        {
          targets: -2,
          render: function (data, type, full, meta) {
            const method = full['payment_method'] || 'Unknown';
            let methodIcon = 'credit-card'; // default icon
            
            // Map payment method to appropriate icon
            switch(method?.toLowerCase()) {
              case 'credit card':
                methodIcon = 'credit-card';
                break;
              case 'debit card':
                methodIcon = 'debit-card';
                break;
              case 'paypal':
                methodIcon = 'paypal';
                break;
              case 'bank transfer':
                methodIcon = 'bank-transfer';
                break;
              case 'cash on delivery':
                methodIcon = 'cash';
                break;
              default:
                methodIcon = 'credit-card';
            }

            return `
              <div class="d-flex align-items-center text-nowrap">
                <img src="${assetsPath}img/icons/payments/${methodIcon}.png" alt="${method}" class="me-2" width="29" onerror="this.style.display='none'">
                <span>${method}</span>
              </div>`;
          }
        },
        {
          targets: -1,
          title: 'Actions',
          searchable: false,
          orderable: false,
          render: function (data, type, full, meta) {
            const orderId = full['_id'];
            return `<div class="d-flex gap-2">
                      <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${orderId}')" title="View">
                        <i class="ri ri-eye-line"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" onclick="editOrder('${orderId}')" title="Edit">
                        <i class="ri ri-edit-line"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${orderId}')" title="Delete">
                        <i class="ri ri-delete-bin-line"></i>
                      </button>
                    </div>`;
          }
        }
      ],
      select: { style: 'multi', selector: 'td:nth-child(2)' },
      order: [3, 'asc'],
      layout: {
        topStart: { search: { placeholder: 'Search Order', text: '_INPUT_' } },
        topEnd: {
          rowClass: 'row mx-2 my-0 justify-content-between',
          features: [
            { pageLength: { menu: [7, 10, 25, 50, 100], text: '_MENU_' } },
            {
              buttons: [
                {
                  extend: 'collection',
                  className: 'btn btn-outline-secondary dropdown-toggle waves-effect',
                  text: '<span class="d-flex align-items-center"><i class="icon-base ri ri-upload-2-line icon-16px me-sm-2"></i> <span class="d-none d-sm-inline-block">Export</span></span>',
                  buttons: [
                    {
                      extend: 'print',
                      text: `<span class="d-flex align-items-center"><i class="icon-base ri ri-printer-line me-1"></i>Print</span>`,
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [3, 4, 5, 6, 7],
                        format: {
                          body: function (inner, coldex, rowdex) {
                            if (inner.length <= 0) return inner;

                            // Check if inner is HTML content
                            if (inner.indexOf('<') > -1) {
                              const parser = new DOMParser();
                              const doc = parser.parseFromString(inner, 'text/html');

                              // Get all text content
                              let text = '';

                              // Handle specific elements
                              const userNameElements = doc.querySelectorAll('.order-name');
                              if (userNameElements.length > 0) {
                                userNameElements.forEach(el => {
                                  // Get text from nested structure
                                  const nameText =
                                    el.querySelector('.fw-medium')?.textContent ||
                                    el.querySelector('.d-block')?.textContent ||
                                    el.textContent;
                                  text += nameText.trim() + ' ';
                                });
                              } else {
                                // Get regular text content
                                text = doc.body.textContent || doc.body.innerText;
                              }

                              return text.trim();
                            }

                            return inner;
                          }
                        }
                      },
                      customize: function (win) {
                        win.document.body.style.color = config.colors.headingColor;
                        win.document.body.style.borderColor = config.colors.borderColor;
                        win.document.body.style.backgroundColor = config.colors.bodyBg;
                        const table = win.document.body.querySelector('table');
                        table.classList.add('compact');
                        table.style.color = 'inherit';
                        table.style.borderColor = 'inherit';
                        table.style.backgroundColor = 'inherit';
                      }
                    },
                    {
                      extend: 'csv',
                      text: `<span class="d-flex align-items-center"><i class="icon-base ri ri-file-text-line me-1"></i>Csv</span>`,
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [3, 4, 5, 6, 7],
                        format: {
                          body: function (inner, coldex, rowdex) {
                            if (inner.length <= 0) return inner;

                            // Parse HTML content
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(inner, 'text/html');

                            let text = '';

                            // Handle order-name elements specifically
                            const userNameElements = doc.querySelectorAll('.order-name');
                            if (userNameElements.length > 0) {
                              userNameElements.forEach(el => {
                                // Get text from nested structure - try different selectors
                                const nameText =
                                  el.querySelector('.fw-medium')?.textContent ||
                                  el.querySelector('.d-block')?.textContent ||
                                  el.textContent;
                                text += nameText.trim() + ' ';
                              });
                            } else {
                              // Handle other elements (status, role, etc)
                              text = doc.body.textContent || doc.body.innerText;
                            }

                            return text.trim();
                          }
                        }
                      }
                    },
                    {
                      extend: 'excel',
                      text: `<span class="d-flex align-items-center"><i class="icon-base ri ri-file-excel-line me-1"></i>Excel</span>`,
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [3, 4, 5, 6, 7],
                        format: {
                          body: function (inner, coldex, rowdex) {
                            if (inner.length <= 0) return inner;

                            // Parse HTML content
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(inner, 'text/html');

                            let text = '';

                            // Handle order-name elements specifically
                            const userNameElements = doc.querySelectorAll('.order-name');
                            if (userNameElements.length > 0) {
                              userNameElements.forEach(el => {
                                // Get text from nested structure - try different selectors
                                const nameText =
                                  el.querySelector('.fw-medium')?.textContent ||
                                  el.querySelector('.d-block')?.textContent ||
                                  el.textContent;
                                text += nameText.trim() + ' ';
                              });
                            } else {
                              // Handle other elements (status, role, etc)
                              text = doc.body.textContent || doc.body.innerText;
                            }

                            return text.trim();
                          }
                        }
                      }
                    },
                    {
                      extend: 'pdf',
                      text: `<span class="d-flex align-items-center"><i class="icon-base ri ri-file-pdf-line me-1"></i>Pdf</span>`,
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [3, 4, 5, 6, 7],
                        format: {
                          body: function (inner, coldex, rowdex) {
                            if (inner.length <= 0) return inner;

                            // Parse HTML content
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(inner, 'text/html');

                            let text = '';

                            // Handle order-name elements specifically
                            const userNameElements = doc.querySelectorAll('.order-name');
                            if (userNameElements.length > 0) {
                              userNameElements.forEach(el => {
                                // Get text from nested structure - try different selectors
                                const nameText =
                                  el.querySelector('.fw-medium')?.textContent ||
                                  el.querySelector('.d-block')?.textContent ||
                                  el.textContent;
                                text += nameText.trim() + ' ';
                              });
                            } else {
                              // Handle other elements (status, role, etc)
                              text = doc.body.textContent || doc.body.innerText;
                            }

                            return text.trim();
                          }
                        }
                      }
                    },
                    {
                      extend: 'copy',
                      text: `<i class="icon-base ri ri-file-copy-line me-1"></i>Copy`,
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [3, 4, 5, 6, 7],
                        format: {
                          body: function (inner, coldex, rowdex) {
                            if (inner.length <= 0) return inner;

                            // Parse HTML content
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(inner, 'text/html');

                            let text = '';

                            // Handle order-name elements specifically
                            const userNameElements = doc.querySelectorAll('.order-name');
                            if (userNameElements.length > 0) {
                              userNameElements.forEach(el => {
                                // Get text from nested structure - try different selectors
                                const nameText =
                                  el.querySelector('.fw-medium')?.textContent ||
                                  el.querySelector('.d-block')?.textContent ||
                                  el.textContent;
                                text += nameText.trim() + ' ';
                              });
                            } else {
                              // Handle other elements (status, role, etc)
                              text = doc.body.textContent || doc.body.innerText;
                            }

                            return text.trim();
                          }
                        }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        bottomStart: { rowClass: 'row mx-3 justify-content-between', features: ['info'] },
        bottomEnd: 'paging'
      },
      language: {
        paginate: {
          next: '<i class="icon-base ri ri-arrow-right-s-line scaleX-n1-rtl icon-22px"></i>',
          previous: '<i class="icon-base ri ri-arrow-left-s-line scaleX-n1-rtl icon-22px"></i>',
          first: '<i class="icon-base ri ri-skip-back-mini-line scaleX-n1-rtl icon-22px"></i>',
          last: '<i class="icon-base ri ri-skip-forward-mini-line scaleX-n1-rtl icon-22px"></i>'
        }
      },
      // For responsive popup
      responsive: {
        details: {
          display: DataTable.Responsive.display.modal({
            header: function (row) {
              const data = row.data();
              return 'Details of ' + data['customer'];
            }
          }),
          type: 'column',
          renderer: function (api, rowIdx, columns) {
            const data = columns
              .map(function (col) {
                return col.title !== '' // Do not show row in modal popup if title is blank (for check box)
                  ? `<tr data-dt-row="${col.rowIndex}" data-dt-column="${col.columnIndex}">
                      <td>${col.title}:</td>
                      <td>${col.data}</td>
                    </tr>`
                  : '';
              })
              .join('');

            if (data) {
              const div = document.createElement('div');
              div.classList.add('table-responsive');
              const table = document.createElement('table');
              div.appendChild(table);
              table.classList.add('table');
              const tbody = document.createElement('tbody');
              tbody.innerHTML = data;
              table.appendChild(tbody);
              return div;
            }
            return false;
          }
        }
      }
    });

    //? Event handlers for order actions - now using global functions like in view-products

    // Function to view order details
    window.viewOrder = function(orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            displayOrderDetails(data.order);
            $('#orderDetailsModal').modal('show');
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: data.message || 'Failed to load order details'
            });
          }
        })
        .catch(error => {
          console.error('Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to load order details'
          });
        });
    }

    // Function to display order details in modal
    function displayOrderDetails(order) {
      const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
      const formatDateTime = (date) => date ? new Date(date).toLocaleString() : 'N/A';
      const formatPrice = (price) => price ? '$' + parseFloat(price).toFixed(2) : 'N/A';

      // Format customer information
      let customerInfo = '';
      if (order.customer_type === 'guest') {
        customerInfo = `
          <div class="d-flex align-items-center mb-2">
            <span class="badge bg-label-warning me-2">Guest</span>
            <strong>${order.guest_name || 'N/A'}</strong>
          </div>
          <div class="text-muted">
            <i class="ri ri-mail-line me-1"></i>${order.guest_email || 'N/A'}<br>
            <i class="ri ri-phone-line me-1"></i>${order.guest_phone || 'N/A'}
          </div>
        `;
      } else if (order.customer_id) {
        customerInfo = `
          <div class="d-flex align-items-center mb-2">
            <span class="badge bg-label-success me-2">Registered</span>
            <strong>${order.customer_id.full_name || 'N/A'}</strong>
          </div>
          <div class="text-muted">
            <i class="ri ri-mail-line me-1"></i>${order.customer_id.email || 'N/A'}<br>
            <i class="ri ri-phone-line me-1"></i>${order.customer_id.phone_number || 'N/A'}
          </div>
        `;
      } else {
        customerInfo = '<span class="text-muted">Unknown Customer</span>';
      }

      // Format products information
      let productsHtml = '';
      if (order.products && order.products.length > 0) {
        productsHtml = order.products.map(item => {
          const product = item.product_id;
          const subtotal = item.quantity * item.unit_price;
          return `
            <tr>
              <td>
                <div class="d-flex flex-column">
                  <h6 class="mb-1">${product ? product.productTitle : 'Unknown Product'}</h6>
                  <small class="text-muted">SKU: ${product ? product.productSku : 'N/A'}</small>
                </div>
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-end">${formatPrice(item.unit_price)}</td>
              <td class="text-end"><strong>${formatPrice(subtotal)}</strong></td>
            </tr>
          `;
        }).join('');
      } else {
        productsHtml = '<tr><td colspan="4" class="text-center text-muted">No products found</td></tr>';
      }

      // Format addresses
      const formatAddress = (address) => {
        if (typeof address === 'object' && address !== null) {
          return `
            ${address.street || ''}<br>
            ${address.city || ''}, ${address.postal_code || ''}<br>
            ${address.country || ''}
          `;
        }
        return address || 'N/A';
      };

      // Get status badge class
      const getStatusClass = (status) => {
        switch(status?.toLowerCase()) {
          case 'pending': return 'bg-label-warning';
          case 'processing': return 'bg-label-info';
          case 'shipped': return 'bg-label-primary';
          case 'delivered': return 'bg-label-success';
          case 'cancelled': return 'bg-label-danger';
          default: return 'bg-label-secondary';
        }
      };

      const getPaymentStatusClass = (status) => {
        switch(status?.toLowerCase()) {
          case 'paid': return 'bg-label-success';
          case 'unpaid': case 'pending': return 'bg-label-warning';
          case 'failed': return 'bg-label-danger';
          case 'refunded': return 'bg-label-info';
          default: return 'bg-label-secondary';
        }
      };

      document.getElementById('orderDetailsContent').innerHTML = `
        <div class="row">
          <!-- Order Information -->
          <div class="col-lg-8">
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Order Information</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label fw-medium">Order Number:</label>
                      <div><code class="fs-6">#${order.order_number}</code></div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-medium">Order Date:</label>
                      <div>${formatDateTime(order.createdAt)}</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-medium">Order Status:</label>
                      <div><span class="badge ${getStatusClass(order.status)}">${order.status || 'Unknown'}</span></div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label class="form-label fw-medium">Payment Method:</label>
                      <div>${order.payment_method || 'N/A'}</div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-medium">Payment Status:</label>
                      <div><span class="badge ${getPaymentStatusClass(order.payment_status)}">${order.payment_status || 'Unknown'}</span></div>
                    </div>
                    <div class="mb-3">
                      <label class="form-label fw-medium">Total Amount:</label>
                      <div><strong class="text-success fs-5">${formatPrice(order.total_price)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Table -->
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Order Items</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-borderless">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th class="text-center">Quantity</th>
                        <th class="text-end">Unit Price</th>
                        <th class="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${productsHtml}
                    </tbody>
                    <tfoot>
                      <tr class="border-top">
                        <td colspan="3" class="text-end"><strong>Total:</strong></td>
                        <td class="text-end"><strong class="text-success">${formatPrice(order.total_price)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer & Address Information -->
          <div class="col-lg-4">
            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Customer Information</h5>
              </div>
              <div class="card-body">
                ${customerInfo}
              </div>
            </div>

            <div class="card mb-4">
              <div class="card-header">
                <h5 class="card-title mb-0">Shipping Address</h5>
              </div>
              <div class="card-body">
                <address class="mb-0">
                  ${formatAddress(order.shipping_address)}
                </address>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h5 class="card-title mb-0">Billing Address</h5>
              </div>
              <div class="card-body">
                <address class="mb-0">
                  ${formatAddress(order.billing_address)}
                </address>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Function to edit order
    window.editOrder = function(orderId) {
      // Redirect to edit order page
      window.location.href = `/edit-order/${orderId}`;
    }

    // Function to delete order
    window.deleteOrder = async function(orderId) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        buttonsStyling: true,
        customClass: {
          actions: 'swal2-actions-gap',
          confirmButton: 'btn btn-danger me-1',
          cancelButton: 'btn btn-secondary'
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/api/orders/${orderId}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              // Reload the DataTable to reflect changes
              dt_products.ajax.reload();
              Swal.fire({
                title: 'Deleted!',
                text: 'Order has been deleted successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            } else {
              throw new Error('Failed to delete order');
            }
          } catch (error) {
            console.error('Error deleting order:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to delete order. Please try again.',
              icon: 'error'
            });
          }
        }
      });
    }
  }

  // Filter form control to default size
  // ? setTimeout used for order-list table initialization
  setTimeout(() => {
    const elementsToModify = [
      { selector: '.dt-buttons .btn', classToRemove: 'btn-secondary', classToAdd: 'btn-outline-secondary' },
      { selector: '.dt-search .form-control', classToAdd: 'ms-0' },
      { selector: '.dt-layout-table', classToRemove: 'row mt-2' },
      { selector: '.dt-layout-end', classToAdd: 'gap-md-2 gap-0 mt-0' },
      { selector: '.dt-layout-end .dt-length', classToAdd: 'mt-md-5 mt-0' },
      { selector: '.dt-layout-start', classToAdd: 'mt-0' },
      { selector: '.dt-layout-end .dt-buttons.btn-group', classToAdd: 'justify-content-center mb-md-0 mb-5' },
      { selector: '.dt-layout-full', classToRemove: 'col-md col-12', classToAdd: 'table-responsive' }
    ];

    // Delete record
    elementsToModify.forEach(({ selector, classToRemove, classToAdd }) => {
      document.querySelectorAll(selector).forEach(element => {
        if (classToRemove) {
          classToRemove.split(' ').forEach(className => element.classList.remove(className));
        }
        if (classToAdd) {
          classToAdd.split(' ').forEach(className => element.classList.add(className));
        }
      });
    });
  }, 100);
});
