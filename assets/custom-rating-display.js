class CustomRatingDisplay {
  constructor() {
    this.appKey = 'hAQoLTsYGZYkd1hFPhK5g8rrcly7yHFLLB5CKDZB';
    this.init();
  }

  init() {
    // Initialize on page load
    this.transformRatings();

    // Listen for product variant changes
    document.addEventListener('DOMContentLoaded', () => {
      this.transformRatings();
      this.observeForYotpoWidgets();
    });

    // Listen for dynamic content updates (variant changes, etc.)
    if (typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, () => {
        setTimeout(() => this.transformRatings(), 100);
      });
    }
  }

  async transformRatings() {
    // Get product ID first
    const productInfo = document.querySelector('product-info[data-product-id]');

    if (productInfo) {
      const productId = productInfo.dataset.productId;
      console.log('Product ID found:', productId, '- fetching fresh rating data from API');

      // Fetch fresh data from API
      const ratingData = await this.fetchYotpoRatingData(productId);
      console.log('Fresh API rating data:', ratingData);

      // Transform ALL rating wrappers with the fresh data
      if (ratingData.rating && ratingData.count) {
        const ratingWrappers = document.querySelectorAll('.rating-wrapper');
        console.log('Found rating wrappers to transform:', ratingWrappers.length);

        ratingWrappers.forEach(wrapper => {
          if (wrapper.dataset.customTransformed === 'true') {
            console.log('Wrapper already transformed, skipping');
            return;
          }

          console.log('Transforming wrapper with fresh API data');
          const customRating = this.createCustomRatingElement(ratingData.rating, ratingData.count);
          wrapper.innerHTML = '';
          wrapper.appendChild(customRating);
          wrapper.dataset.customTransformed = 'true';
        });
      }
    } else {
      console.warn('No product-info element found, falling back to old method');
      // Fallback to old method
      this.transformNativeRatings();
      await this.transformYotpoRatings();
    }
  }

  transformNativeRatings() {
    const ratingWrappers = document.querySelectorAll('.rating-wrapper');

    ratingWrappers.forEach(wrapper => {
      if (wrapper.dataset.customTransformed === 'true') return;

      const ratingElement = wrapper.querySelector('.rating');
      const ratingCountElement = wrapper.querySelector('.rating-count');

      if (!ratingElement || !ratingCountElement) return;

      // Extract rating value from the rating-text or calculate from stars
      const ratingText = wrapper.querySelector('.rating-text span[aria-hidden="true"]');
      let ratingValue = '0';

      if (ratingText) {
        const textContent = ratingText.textContent.trim();
        const match = textContent.match(/^([0-9.]+)/);
        if (match) {
          ratingValue = parseFloat(match[1]).toFixed(1);
        }
      } else {
        // Fallback: extract from CSS variables or data attributes
        const ratingSpan = ratingElement.querySelector('.rating-star');
        if (ratingSpan) {
          const style = ratingSpan.getAttribute('style');
          const ratingMatch = style.match(/--rating:\s*([0-9.]+)/);
          const maxMatch = style.match(/--rating-max:\s*([0-9.]+)/);
          const decimalMatch = style.match(/--rating-decimal:\s*([0-9.]+)/);

          if (ratingMatch && maxMatch) {
            const rating = parseFloat(ratingMatch[1]);
            const decimal = decimalMatch ? parseFloat(decimalMatch[1]) : 0;
            ratingValue = (rating + decimal).toFixed(1);
          }
        }
      }

      // Additional fallback: check for data attributes on the wrapper
      if (ratingValue === '0') {
        const dataRating = wrapper.dataset.rating || wrapper.getAttribute('data-rating-value');
        if (dataRating) {
          ratingValue = parseFloat(dataRating).toFixed(1);
        }
      }

      // Extract review count
      const countSpan = ratingCountElement.querySelector('span[aria-hidden="true"]');
      let reviewCount = '0';

      if (countSpan) {
        const countText = countSpan.textContent.trim();
        const match = countText.match(/\((\d+)\)/);
        if (match) {
          reviewCount = match[1];
        }
      }

      // Create the new custom rating display
      const customRating = this.createCustomRatingElement(ratingValue, reviewCount);

      // Replace the wrapper content with the actual element (not innerHTML)
      wrapper.innerHTML = '';
      wrapper.appendChild(customRating);
      wrapper.dataset.customTransformed = 'true';
    });
  }

  async transformYotpoRatings() {
    // Look for Yotpo rating elements and get product IDs
    const yotpoElements = document.querySelectorAll('.yotpo.bottomLine[data-yotpo-product-id], .yotpo-bottomline[data-product-id]');

    console.log('Found Yotpo elements:', yotpoElements.length);

    // If no Yotpo elements, try to get product ID from page meta or product-info element
    if (yotpoElements.length === 0) {
      console.log('No Yotpo elements with data attributes, looking for product ID in page...');

      // Try to find product ID from the product-info element
      const productInfo = document.querySelector('product-info[data-product-id]');
      if (productInfo) {
        const productId = productInfo.dataset.productId;
        console.log('Found product ID from product-info element:', productId);

        // Look for any rating-wrapper that might need transformation
        const ratingWrappers = document.querySelectorAll('.rating-wrapper:not([data-custom-transformed])');
        console.log('Found rating wrappers to check:', ratingWrappers.length);

        for (const wrapper of ratingWrappers) {
          // Skip if already transformed by transformNativeRatings
          if (wrapper.dataset.customTransformed === 'true') {
            console.log('Wrapper already transformed, skipping');
            continue;
          }

          // Check if this wrapper has Yotpo widget inside
          const hasYotpo = wrapper.querySelector('.yotpo.bottomLine, .yotpo-bottomline');

          if (hasYotpo || wrapper.classList.contains('yotpo-widget-wrapper')) {
            console.log('Found rating wrapper with Yotpo, fetching data for product:', productId);

            // Fetch fresh data from Yotpo API
            const ratingData = await this.fetchYotpoRatingData(productId);
            console.log('Fetched rating data:', ratingData);

            if (ratingData.rating && ratingData.count) {
              const customRating = this.createCustomRatingElement(ratingData.rating, ratingData.count);
              wrapper.innerHTML = '';
              wrapper.appendChild(customRating);
              wrapper.dataset.customTransformed = 'true';
              console.log('Replaced wrapper with custom rating');
            }
          }
        }
      }
    }

    for (const element of yotpoElements) {
      if (element.dataset.customTransformed === 'true') {
        console.log('Element already transformed, skipping');
        continue;
      }

      // Get product ID from data attribute
      const productId = element.dataset.yotpoProductId || element.dataset.productId;
      console.log('Processing Yotpo element with product ID:', productId);

      if (productId) {
        // Fetch fresh data from Yotpo API
        const ratingData = await this.fetchYotpoRatingData(productId);
        console.log('Fetched rating data for product', productId, ':', ratingData);

        if (ratingData.rating && ratingData.count) {
          const customRating = this.createCustomRatingElement(ratingData.rating, ratingData.count);

          // Find the best parent container to replace
          const container = element.closest('.rating-wrapper') || element.closest('.yotpo-widget-wrapper') || element;

          if (container) {
            console.log('Replacing container with custom rating display');
            container.innerHTML = '';
            container.appendChild(customRating);
            container.dataset.customTransformed = 'true';
          }
        } else {
          console.warn('No valid rating data returned for product:', productId);
        }
      } else {
        console.warn('No product ID found on element:', element);
      }
    }
  }

  async fetchYotpoRatingData(productId) {
    try {
      const url = `https://api-cdn.yotpo.com/v1/widget/${this.appKey}/products/${productId}/reviews.json?per_page=1&page=1`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('API response for product', productId, ':', data);

      if (data.response && data.response.bottomline) {
        const bottomline = data.response.bottomline;
        console.log('Bottomline data:', bottomline);

        return {
          rating: bottomline.average_score ? bottomline.average_score.toFixed(1) : '0',
          count: bottomline.total_review || 0
        };
      } else {
        console.warn('No bottomline data in response:', data);
      }
    } catch (error) {
      console.error('Error fetching Yotpo rating data:', error);
    }

    return { rating: null, count: null };
  }


  createCustomRatingElement(rating, count) {
    const container = document.createElement('a');
    container.className = 'custom-rating-display';
    container.href = '#custom-reviews-container';
    container.setAttribute('role', 'link');
    container.setAttribute('aria-label', `${rating} out of 5 stars, ${count} reviews - Click to view reviews`);
    
    container.innerHTML = `
      <span class="custom-rating-value" aria-hidden="true">${rating} Rating</span>
      <span class="custom-rating-count" aria-hidden="true">${count} reviews</span>
    `;
    
    // Add smooth scroll behavior with offset
    container.addEventListener('click', (e) => {
      console.log('Rating display clicked');
      e.preventDefault();
      const reviewsContainer = document.getElementById('custom-reviews-container');
      console.log('Reviews container found:', reviewsContainer);
      
      if (reviewsContainer) {
        const rect = reviewsContainer.getBoundingClientRect();
        console.log('Container rect:', rect);
        console.log('Window pageYOffset:', window.pageYOffset);
        
        const elementPosition = rect.top + window.pageYOffset;
        const offsetPosition = elementPosition - 130;
        
        console.log('Element position:', elementPosition);
        console.log('Offset position (with -130px):', offsetPosition);
        console.log('About to scroll to:', offsetPosition);
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        console.log('Scroll command executed');
      } else {
        console.error('Reviews container not found with ID: custom-reviews-container');
      }
    });
    
    return container;
  }

  observeForYotpoWidgets() {
    // Use MutationObserver to watch for dynamically loaded Yotpo content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Check if the added node or its children contain Yotpo elements
              if (node.matches && (node.matches('.yotpo-bottomline') || node.matches('[data-yotpo-element-id]') || node.matches('.yotpo-sr-bottom-line-summary'))) {
                setTimeout(() => this.transformYotpoRatings(), 500);
              } else if (node.querySelector) {
                const yotpoElements = node.querySelectorAll('.yotpo-bottomline, [data-yotpo-element-id], .yotpo-sr-bottom-line-summary');
                if (yotpoElements.length > 0) {
                  setTimeout(() => this.transformYotpoRatings(), 500);
                }
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the custom rating display
if (!window.customRatingDisplay) {
  window.customRatingDisplay = new CustomRatingDisplay();
}