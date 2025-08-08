/**
 * App eCommerce Add Product Script
 */
'use strict';

//Javascript to handle the e-commerce product add page

(function () {
  // Comment editor
  let commentEditor;
  const commentEditorEl = document.querySelector('.comment-editor');

  if (commentEditorEl) {
    commentEditor = new Quill(commentEditorEl, {
      modules: {
        toolbar: '.comment-toolbar'
      },
      placeholder: 'Product Description',
      theme: 'snow'
    });
  }

  // Store uploaded images
  let uploadedImages = [];

  // previewTemplate: Updated Dropzone default previewTemplate
  // ! Don't change it unless you really know what you are doing

  const previewTemplate = `<div class="dz-preview dz-file-preview">
<div class="dz-details">
  <div class="dz-thumbnail">
    <img data-dz-thumbnail>
    <span class="dz-nopreview">No preview</span>
    <div class="dz-success-mark"></div>
    <div class="dz-error-mark"></div>
    <div class="dz-error-message"><span data-dz-errormessage></span></div>
    <div class="progress">
      <div class="progress-bar progress-bar-primary" role="progressbar" aria-valuemin="0" aria-valuemax="100" data-dz-uploadprogress></div>
    </div>
  </div>
  <div class="dz-filename" data-dz-name></div>
  <div class="dz-size" data-dz-size></div>
</div>
</div>`;

  // Basic Dropzone
  const dropzoneBasic = document.querySelector('#dropzone-basic');
  let myDropzone;
  
  console.log('Dropzone element found:', dropzoneBasic); // Debug log
  
  if (dropzoneBasic) {
    myDropzone = new Dropzone(dropzoneBasic, {
      url: '/upload', // Add the upload URL
      paramName: 'file', // Must match server expectation
      previewTemplate: previewTemplate,
      parallelUploads: 1,
      maxFilesize: 5,
      acceptedFiles: '.jpg,.jpeg,.png,.gif',
      addRemoveLinks: true,
      maxFiles: 10,
      autoProcessQueue: false, // Changed to false to control when uploads happen
      dictDefaultMessage: 'Drag and drop your image here or click to browse',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      },
      init: function() {
        console.log('Dropzone initialized with config:', this.options);
        console.log('Dropzone URL will be:', this.options.url);
        console.log('Current page location:', window.location.href);
        console.log('Resolved upload URL:', new URL(this.options.url, window.location.href).href);
        
        this.on('sending', function(file, xhr, formData) {
          console.log('Sending file:', file.name, 'to:', this.options.url);
          console.log('Actual XHR URL:', xhr.responseURL || 'Unknown');
          console.log('FormData keys:', Array.from(formData.keys()));
          console.log('XHR object:', xhr);
          console.log('Request URL:', xhr._url || 'Unknown');
        });
        
        this.on('uploadprogress', function(file, progress) {
          console.log('Upload progress:', file.name, progress + '%');
        });
        
        this.on('complete', function(file) {
          console.log('Upload complete for:', file.name);
          console.log('File status:', file.status);
          console.log('Server response:', file.xhr ? file.xhr.responseText : 'No response');
        });
      },
      success: function(file, response) {
        console.log('Upload success raw response:', response);
        
        // Parse response if it's a string
        let parsedResponse = response;
        if (typeof response === 'string') {
          try {
            parsedResponse = JSON.parse(response);
          } catch (e) {
            console.error('Failed to parse response as JSON:', response);
            return;
          }
        }
        
        console.log('Parsed response:', parsedResponse);
        
        if (parsedResponse && parsedResponse.images && parsedResponse.images.length > 0) {
          uploadedImages.push(parsedResponse.images[0]);
          file.uploadedFilename = parsedResponse.images[0];
          console.log('Added image to uploadedImages:', parsedResponse.images[0]);
          console.log('Current uploadedImages:', uploadedImages);
        }
      },
      error: function(file, errorMessage) {
        console.error('Upload error:', errorMessage);
        console.error('Error details:', file);
      },
      removedfile: function(file) {
        if (file.uploadedFilename) {
          uploadedImages = uploadedImages.filter(img => img !== file.uploadedFilename);
          console.log('Removed image from uploadedImages:', file.uploadedFilename);
          console.log('Current uploadedImages after removal:', uploadedImages);
        }
        file.previewElement.remove();
      }
    });
    
    console.log('Dropzone initialized:', myDropzone); // Debug log
  } else {
    console.error('Dropzone element not found!'); // Debug log
  }

  // Form submission handler
  const addProductForm = document.getElementById('addProductForm');
  const publishBtn = document.getElementById('publishBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');

  if (addProductForm) {
    // Publish product
    if (publishBtn) {
      publishBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitProduct(false);
      });
    }

    // Save as draft
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitProduct(true);
      });
    }
  }

  function submitProduct(isDraft = false) {
    // Show loading state
    const spinner = publishBtn ? publishBtn.querySelector('.spinner-border') : null;
    const btnText = isDraft ? 'Saving...' : 'Publishing...';
    
    if (!isDraft && publishBtn) {
      // Show spinner if it exists, otherwise create one
      if (spinner) {
        spinner.classList.remove('d-none');
      }
      publishBtn.disabled = true;
      publishBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${btnText}`;
    }

    // Get description from Quill editor
    if (commentEditor) {
      const description = commentEditor.root.innerHTML;
      const hiddenInput = document.getElementById('productDescriptionHidden');
      if (hiddenInput) {
        hiddenInput.value = description;
      }
    }

    // First upload images if any
    if (myDropzone && myDropzone.getQueuedFiles().length > 0) {
      console.log('Processing queued files...', myDropzone.getQueuedFiles().length);
      
      // Set up one-time listener for when all uploads complete
      const onQueueComplete = function() {
        console.log('All uploads complete, submitting form...');
        myDropzone.off('queuecomplete', onQueueComplete); // Remove listener
        setTimeout(() => {
          submitFormData(isDraft);
        }, 500); // Small delay to ensure all success callbacks have run
      };
      
      myDropzone.on('queuecomplete', onQueueComplete);
      myDropzone.processQueue();
    } else {
      console.log('No queued files, submitting form directly...');
      submitFormData(isDraft);
    }
  }

  function submitFormData(isDraft = false) {
    console.log('Starting form submission...'); // Debug log
    
    const formData = new FormData(addProductForm);
    
    // Get description from Quill editor
    if (commentEditor) {
      const description = commentEditor.root.innerHTML;
      formData.set('description', description); // Use set instead of append to override
    }
    
    // Add uploaded images
    console.log('Adding images to form data:', uploadedImages);
    if (uploadedImages.length > 0) {
      formData.append('images', JSON.stringify(uploadedImages));
      console.log('Images added to form data as JSON string');
    } else {
      console.log('No uploaded images to add');
    }

    // Add draft status
    formData.append('isDraft', isDraft);

    // Collect variants - using the new system with productVariants array
    let variants = [];
    
    // Check if productVariants is available (from the new variant system)
    if (typeof productVariants !== 'undefined' && Array.isArray(productVariants)) {
      variants = productVariants
        .filter(v => v.type && v.values && v.values.length > 0)
        .map(v => ({ type: v.type, values: v.values }));
    }
    
    if (variants.length > 0) {
      formData.append('variants', JSON.stringify(variants));
      console.log('Variants being submitted:', variants);
    } else {
      console.log('No variants to submit');
    }

    // Collect attributes
    const attributes = {
      fragile: document.querySelector('[name="fragile"]')?.checked || false,
      biodegradable: document.querySelector('[name="biodegradable"]')?.checked || false,
      frozen: document.querySelector('[name="frozen"]')?.checked || false,
      maxTemperature: document.querySelector('[name="maxTemperature"]')?.value || '',
      hasExpiryDate: document.querySelector('[name="hasExpiryDate"]')?.checked || false,
      expiryDate: document.querySelector('[name="expiryDate"]')?.value || ''
    };
    formData.append('attributes', JSON.stringify(attributes));

    // Handle tags - they're already comma-separated, don't stringify
    const tagsInput = document.querySelector('[name="tags"]');
    if (tagsInput && tagsInput.value.trim()) {
      // Check if it's Tagify format (JSON) or simple comma-separated
      try {
        const tagsValue = tagsInput.value;
        if (tagsValue.startsWith('[')) {
          // Parse Tagify JSON format and extract values
          const tagifyData = JSON.parse(tagsValue);
          const tagValues = tagifyData.map(tag => tag.value || tag).join(',');
          formData.set('tags', tagValues);
        } else {
          // It's already comma-separated, leave as is
        }
      } catch (e) {
        console.log('Error processing tags:', e);
        // Leave tags as they are if parsing fails
      }
    }

    // Ensure required fields are present
    const requiredFields = ['productTitle', 'productSku', 'productPrice', 'category'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      const value = formData.get(field);
      if (!value || value.trim() === '') {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      showNotification('error', `Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Log form data for debugging
    console.log('Form data being sent:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // Submit to backend with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    fetch('/api/products', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    })
    .then(response => {
      clearTimeout(timeoutId);
      console.log('Response received:', response.status, response.statusText); // Debug log
      
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }).catch(() => {
          throw new Error(`HTTP error! status: ${response.status}`);
        });
      }
      
      return response.json();
    })
    .then(data => {
      console.log('Success response:', data); // Debug log
      if (data.success) {
        showNotification('success', isDraft ? 'Product saved as draft!' : 'Product published successfully!');
        // Reset form after successful submission
        setTimeout(() => {
          addProductForm.reset();
          uploadedImages = [];
          if (myDropzone) {
            myDropzone.removeAllFiles();
          }
          if (commentEditor) {
            commentEditor.setContents([]);
          }
        }, 1000);
      } else {
        showNotification('error', data.error || data.message || 'Error saving product');
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error('Error details:', error); // Enhanced error logging
      
      if (error.name === 'AbortError') {
        showNotification('error', 'Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('fetch')) {
        showNotification('error', 'Network error. Please check if the server is running.');
      } else {
        showNotification('error', `Error submitting product: ${error.message}`);
      }
    })
    .finally(() => {
      // Reset button state
      if (publishBtn) {
        const spinner = publishBtn.querySelector('.spinner-border');
        if (spinner) {
          spinner.classList.add('d-none');
        }
        publishBtn.disabled = false;
        publishBtn.innerHTML = 'Publish Product';
      }
    });
  }

  function showNotification(type, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Basic Tags
  const tagifyBasicEl = document.querySelector('#ecommerce-product-tags');
  if (tagifyBasicEl) {
    const TagifyBasic = new Tagify(tagifyBasicEl);
  }

  // Flatpickr
  // Datepicker
  const date = new Date();
  const productDate = document.querySelector('.product-date');

  if (productDate) {
    productDate.flatpickr({
      monthSelectorType: 'static',
      defaultDate: date
    });
  }
})();

//Jquery to handle the e-commerce product add page

$(function () {
  // Select2
  var select2 = $('.select2');
  if (select2.length) {
    select2.each(function () {
      var $this = $(this);
      select2Focus($this);
      $this.select2({
        dropdownParent: $this.parent(),
        placeholder: $this.data('placeholder') // for dynamic placeholder
      });
    });
  }

  var formRepeater = $('.form-repeater');

  // Form Repeater
  // ! Using jQuery each loop to add dynamic id and class for inputs. You may need to improve it based on form fields.
  // -----------------------------------------------------------------------------------------------------------------

  if (formRepeater.length) {
    var row = 2;
    var col = 1;
    formRepeater.on('submit', function (e) {
      e.preventDefault();
    });
    formRepeater.repeater({
      show: function () {
        var fromControl = $(this).find('.form-control, .form-select');
        var formLabel = $(this).find('.form-label');

        fromControl.each(function (i) {
          var id = 'form-repeater-' + row + '-' + col;
          $(fromControl[i]).attr('id', id);
          $(formLabel[i]).attr('for', id);
          col++;
        });

        row++;
        $(this).slideDown();
        $('.select2-container').remove();
        $('.select2.form-select').select2({
          placeholder: 'Placeholder text'
        });
        $('.select2-container').css('width', '100%');
        var $this = $(this);
        select2Focus($this);
        $('.form-repeater:first .form-select').select2({
          dropdownParent: $(this).parent(),
          placeholder: 'Placeholder text'
        });
        $('.position-relative .select2').each(function () {
          $(this).select2({
            dropdownParent: $(this).closest('.position-relative')
          });
        });
      }
    });
  }
});
