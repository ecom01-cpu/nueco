class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    
    // Initialize gift note toggle
    this.initGiftNoteToggle();
    
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
        
        // Only initialize swiper if not called from renderContents
        if (!this.isRenderingContents) {
          this.initRecommendationsSwiper();
        }
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  initGiftNoteToggle() {
    const giftNoteToggle = this.querySelector('.gift-note-toggle');
    const giftNoteSection = this.querySelector('#gift-note-section');
    
    if (giftNoteToggle && giftNoteSection) {
      // Remove existing listener if present
      if (this.giftNoteHandler) {
        giftNoteToggle.removeEventListener('click', this.giftNoteHandler);
      }
      
      // Create and store the handler
      this.giftNoteHandler = (event) => {
        event.preventDefault();
        const isExpanded = giftNoteToggle.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          giftNoteToggle.setAttribute('aria-expanded', 'false');
          giftNoteSection.setAttribute('hidden', '');
          giftNoteToggle.querySelector('span').textContent = 'Add Gift Note';
        } else {
          giftNoteToggle.setAttribute('aria-expanded', 'true');
          giftNoteSection.removeAttribute('hidden');
          giftNoteToggle.querySelector('span').textContent = 'Close';
          
          // Focus on the textarea when opened
          const textarea = giftNoteSection.querySelector('textarea');
          if (textarea) {
            setTimeout(() => textarea.focus(), 100);
          }
        }
      };
      
      giftNoteToggle.addEventListener('click', this.giftNoteHandler);
    }
  }

  initRecommendationsSwiper() {
    // Prevent duplicate initialization
    if (this.swiperInitializing) {
      console.log('Swiper initialization already in progress');
      return;
    }
    this.swiperInitializing = true;
    
    // Initialize swiper after a short delay to ensure DOM is ready
    setTimeout(() => {
      // Only initialize if Swiper is available
      if (typeof Swiper === 'undefined') {
        console.log('Swiper not available yet, retrying...');
        this.swiperInitializing = false;
        setTimeout(() => this.initRecommendationsSwiper(), 500);
        return;
      }
      
      const swiperEl = this.querySelector('.recommendations-swiper');
      if (!swiperEl) {
        console.log('No swiper element found');
        this.swiperInitializing = false;
        return;
      }
      
      // Check if swiper wrapper has slides
      const slides = swiperEl.querySelectorAll('.swiper-slide');
      if (!slides || slides.length === 0) {
        console.log('No swiper slides found');
        this.swiperInitializing = false;
        return;
      }
      
      // Destroy any existing swiper instance
      if (swiperEl.swiper) {
        console.log('Destroying existing swiper');
        swiperEl.swiper.destroy(true, true);
      }
      
      // Also check for swiper-container-initialized class and remove it
      if (swiperEl.classList.contains('swiper-initialized') || 
          swiperEl.classList.contains('swiper-container-initialized')) {
        swiperEl.classList.remove('swiper-initialized', 'swiper-container-initialized');
        // Reset swiper wrapper styles
        const wrapper = swiperEl.querySelector('.swiper-wrapper');
        if (wrapper) {
          wrapper.style.transform = '';
          wrapper.style.transitionDuration = '';
        }
      }
      
      console.log('Initializing recommendations swiper with', slides.length, 'slides');
      const swiper = new Swiper(swiperEl, {
        slidesPerView: 2.2,
        spaceBetween: 10,
        freeMode: {
          enabled: true,
          sticky: false
        },
        grabCursor: true,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        calculateHeight: true,
        updateOnWindowResize: true,
        breakpoints: {
          320: {
            slidesPerView: 2.2,
            spaceBetween: 10
          },
          768: {
            slidesPerView: 2.5,
            spaceBetween: 10
          }
        },
        on: {
          init: function() {
            console.log('Swiper init event fired');
            // Force update after initialization
            setTimeout(() => {
              this.update();
              this.updateSlides();
              this.updateProgress();
              this.updateSlidesClasses();
            }, 100);
          },
          afterInit: function() {
            console.log('Swiper fully initialized');
          }
        }
      });
      
      // Store swiper instance on element for future reference
      swiperEl.swiper = swiper;
      
      console.log('Recommendations swiper initialized:', swiper);
      
      // Reset flag
      this.swiperInitializing = false;
    }, 300); // Increased delay to ensure DOM is fully ready
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    // Set flag to prevent double initialization
    this.isRenderingContents = true;
    
    
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) {
        return;
      }
      
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      // Fetch the actual cart data to get the correct item count
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          // Update the cart count with the actual count from the cart
          this.updateCartCount(cart.item_count);
        })
        .catch(error => {
          console.error('[Cart Drawer] Error fetching cart data:', error);
        });
      
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.initGiftNoteToggle(); // Reinitialize gift note toggle after cart update
      this.open();
      
      // Initialize swiper after drawer animation completes
      setTimeout(() => {
        this.initRecommendationsSwiper();
        // Reset flag after initialization
        this.isRenderingContents = false;
      }, 500); // Increased delay to ensure DOM and drawer animation are complete
    }, 50); // Small delay to ensure DOM updates are applied
  }

  updateCartCount(count) {
    // Try multiple selectors to find the cart count element
    let cartCountElement = this.querySelector('[data-cart-count]');
    
    // If not found in this element, try document-wide search
    if (!cartCountElement) {
      cartCountElement = document.querySelector('.cart-drawer__item-count[data-cart-count]');
    }
    
    // Also try finding it within the cart drawer specifically
    if (!cartCountElement) {
      const cartDrawer = document.getElementById('CartDrawer');
      if (cartDrawer) {
        cartCountElement = cartDrawer.querySelector('[data-cart-count]');
      }
    }
    
    if (cartCountElement) {
      cartCountElement.textContent = count || '0';
    }
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    if (!html) {
      console.error('CartDrawer getSectionInnerHTML - html is null or undefined');
      return '';
    }
    const element = new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    if (!element) {
      console.error('CartDrawer getSectionInnerHTML - selector not found:', selector);
      return '';
    }
    return element.innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

// Debug logging
console.log('[cart-drawer.js] Script loaded, checking for CartItems...');

// Check if CartItems is defined, if not wait for it
if (typeof CartItems === 'undefined') {
  console.error('[cart-drawer.js] CartItems not defined yet, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[cart-drawer.js] DOMContentLoaded fired, checking CartItems again...');
    if (typeof CartItems !== 'undefined') {
      console.log('[cart-drawer.js] CartItems now available, defining CartDrawerItems');
      class CartDrawerItems extends CartItems {
        getSectionsToRender() {
    const cartDrawer = document.getElementById('CartDrawer');
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer';
    
    // Fallback to 'cart-drawer' if sectionId is empty
    if (!sectionId || sectionId === '') {
      sectionId = 'cart-drawer';
    }
    
    console.log('CartDrawerItems getSectionsToRender - sectionId:', sectionId);
    
    return [
      {
        id: 'CartDrawer',
        section: sectionId,
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
  
  // Override updateQuantity to check for samples after cart update
  updateQuantity(line, quantity, event, name, variantId) {
    // Store the cart drawer element to check threshold
    const cartDrawer = document.querySelector('cart-drawer');
    const threshold = cartDrawer ? parseFloat(cartDrawer.dataset.threshold) : null;
    
    // Wrap the original fetch to add sample removal logic
    this.enableLoading(line);

    const sectionsToRender = this.getSectionsToRender();
    console.log('updateQuantity - sectionsToRender:', sectionsToRender);
    
    const body = JSON.stringify({
      line,
      quantity,
      sections: sectionsToRender.map((section) => section.section),
      sections_url: window.location.pathname,
    });
    
    console.log('updateQuantity - request body:', body);
    const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        console.log('updateQuantity - response status:', response.status);
        if (!response.ok) {
          console.error('updateQuantity - response not ok:', response);
        }
        return response.text();
      })
      .then((state) => {
        console.log('updateQuantity - response state:', state);
        const parsedState = JSON.parse(state);
        
        // Check if cart dropped below threshold and has samples
        if (threshold && parsedState.total_price < threshold) {
          console.log('Cart dropped below threshold, checking for samples...');
          
          // Find sample products in cart
          const sampleProducts = parsedState.items.filter(item => 
            item.product_type === 'Sample' || 
            item.properties && item.properties._sample === 'true'
          );
          
          if (sampleProducts.length > 0) {
            console.log('Found samples to remove:', sampleProducts);
            
            // Build update object to remove all samples
            let update_data = {};
            sampleProducts.forEach((item) => {
              update_data[item.key || item.id] = 0;
            });
            
            const removeBody = JSON.stringify({
              updates: update_data,
              sections: sectionsToRender.map((section) => section.section),
              sections_url: window.location.pathname
            });
            
            // Remove samples first, then update UI
            return fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body: removeBody } })
              .then((response) => response.text())
              .then((updatedState) => {
                console.log('Samples removed, updating UI');
                return updatedState;
              });
          }
        }
        
        return state;
      })
      .then((state) => {
        const parsedState = typeof state === 'string' ? JSON.parse(state) : state;
        
        // Continue with normal update flow
        CartPerformance.measure(`${eventTarget}:paint-updated-sections"`, () => {
          const quantityElement =
            document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
          const items = document.querySelectorAll('.cart-item');

          if (parsedState.errors) {
            quantityElement.value = quantityElement.getAttribute('value');
            this.updateLiveRegions(line, parsedState.errors);
            return;
          }

          this.classList.toggle('is-empty', parsedState.item_count === 0);
          const cartDrawerWrapper = document.querySelector('cart-drawer');
          const cartFooter = document.getElementById('main-cart-footer');

          if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
          if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

          this.getSectionsToRender().forEach((section) => {
            const sectionHtml = parsedState.sections[section.section];
            if (!sectionHtml) {
              console.warn('Section HTML is null for:', section.section);
              return;
            }
            
            const sectionElement = document.getElementById(section.id);
            if (!sectionElement) {
              console.warn('Section element not found:', section.id);
              return;
            }
            
            const elementToReplace = sectionElement.querySelector(section.selector) || sectionElement;
            
            if (elementToReplace) {
              elementToReplace.innerHTML = this.getSectionInnerHTML(
                sectionHtml,
                section.selector
              );
            }
          });
          
          // Reinitialize gift note toggle after updating sections
          if (cartDrawerWrapper && typeof cartDrawerWrapper.initGiftNoteToggle === 'function') {
            cartDrawerWrapper.initGiftNoteToggle();
          }

          // Reinitialize recommendations swiper after updating sections
          if (cartDrawerWrapper && typeof cartDrawerWrapper.initRecommendationsSwiper === 'function') {
            cartDrawerWrapper.initRecommendationsSwiper();
          }

          // Reinitialize subscription tooltips after updating sections
          if (window.subscriptionTooltipManager && typeof window.subscriptionTooltipManager.reinitialize === 'function') {
            window.subscriptionTooltipManager.reinitialize();
          }
          
          const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
          let message = '';
          if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
            if (typeof updatedValue === 'undefined') {
              message = window.cartStrings.error;
            } else {
              message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
            }
          }
          this.updateLiveRegions(line, message);

          const lineItem =
            document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
          if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
            cartDrawerWrapper
              ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
              : lineItem.querySelector(`[name="${name}"]`).focus();
          } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
          } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
            trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
          }
        });

        CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);
        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((error) => {
        console.error('updateQuantity - fetch error:', error);
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('CartDrawerItems getSectionInnerHTML - html is null or undefined');
      return '';
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    if (!element) {
      console.error('CartDrawerItems getSectionInnerHTML - selector not found:', selector);
      return '';
    }
    return element.innerHTML;
  }
}

      customElements.define('cart-drawer-items', CartDrawerItems);
    } else {
      console.error('[cart-drawer.js] CartItems still not available after DOMContentLoaded!');
    }
  });
} else {
  console.log('[cart-drawer.js] CartItems already defined, defining CartDrawerItems immediately');
  class CartDrawerItems extends CartItems {
    getSectionsToRender() {
      const cartDrawer = document.getElementById('CartDrawer');
      let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer';
      
      // Fallback to 'cart-drawer' if sectionId is empty
      if (!sectionId || sectionId === '') {
        sectionId = 'cart-drawer';
      }
      
      console.log('CartDrawerItems getSectionsToRender - sectionId:', sectionId);
      
      return [
        {
          id: 'CartDrawer',
          section: sectionId,
          selector: '.drawer__inner',
        },
        {
          id: 'cart-icon-bubble',
          section: 'cart-icon-bubble',
          selector: '.shopify-section',
        },
      ];
    }
    
    // Override updateQuantity to check for samples after cart update
    updateQuantity(line, quantity, event, name, variantId) {
      // Store the cart drawer element to check threshold
      const cartDrawer = document.querySelector('cart-drawer');
      const threshold = cartDrawer ? parseFloat(cartDrawer.dataset.threshold) : null;
      
      // Wrap the original fetch to add sample removal logic
      this.enableLoading(line);

      const sectionsToRender = this.getSectionsToRender();
      console.log('updateQuantity - sectionsToRender:', sectionsToRender);
      
      const body = JSON.stringify({
        line,
        quantity,
        sections: sectionsToRender.map((section) => section.section),
        sections_url: window.location.pathname,
      });
      
      console.log('updateQuantity - request body:', body);
      const eventTarget = event.currentTarget instanceof CartRemoveButton ? 'clear' : 'change';

      fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
        .then((response) => {
          console.log('updateQuantity - response status:', response.status);
          if (!response.ok) {
            console.error('updateQuantity - response not ok:', response);
          }
          return response.text();
        })
        .then((state) => {
          console.log('updateQuantity - response state:', state);
          const parsedState = JSON.parse(state);
          
          // Check if cart dropped below threshold and has samples
          if (threshold && parsedState.total_price < threshold) {
            console.log('Cart dropped below threshold, checking for samples...');
            
            // Find sample products in cart
            const sampleProducts = parsedState.items.filter(item => 
              item.product_type === 'Sample' || 
              item.properties && item.properties._sample === 'true'
            );
            
            if (sampleProducts.length > 0) {
              console.log('Found samples to remove:', sampleProducts);
              
              // Build update object to remove all samples
              let update_data = {};
              sampleProducts.forEach((item) => {
                update_data[item.key || item.id] = 0;
              });
              
              const removeBody = JSON.stringify({
                updates: update_data,
                sections: sectionsToRender.map((section) => section.section),
                sections_url: window.location.pathname
              });
              
              // Remove samples first, then update UI
              return fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body: removeBody } })
                .then((response) => response.text())
                .then((updatedState) => {
                  console.log('Samples removed, updating UI');
                  return updatedState;
                });
            }
          }
          
          return state;
        })
        .then((state) => {
          const parsedState = typeof state === 'string' ? JSON.parse(state) : state;
          
          // Continue with normal update flow
          CartPerformance.measure(`${eventTarget}:paint-updated-sections"`, () => {
            const quantityElement =
              document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
            const items = document.querySelectorAll('.cart-item');

            if (parsedState.errors) {
              quantityElement.value = quantityElement.getAttribute('value');
              this.updateLiveRegions(line, parsedState.errors);
              return;
            }

            this.classList.toggle('is-empty', parsedState.item_count === 0);
            const cartDrawerWrapper = document.querySelector('cart-drawer');
            const cartFooter = document.getElementById('main-cart-footer');

            if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
            if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

            this.getSectionsToRender().forEach((section) => {
              const sectionHtml = parsedState.sections[section.section];
              if (!sectionHtml) {
                console.warn('Section HTML is null for:', section.section);
                return;
              }
              
              const sectionElement = document.getElementById(section.id);
              if (!sectionElement) {
                console.warn('Section element not found:', section.id);
                return;
              }
              
              const elementToReplace = sectionElement.querySelector(section.selector) || sectionElement;
              
              if (elementToReplace) {
                elementToReplace.innerHTML = this.getSectionInnerHTML(
                  sectionHtml,
                  section.selector
                );
              }
            });
            
            // Reinitialize gift note toggle after updating sections
            if (cartDrawerWrapper && typeof cartDrawerWrapper.initGiftNoteToggle === 'function') {
              cartDrawerWrapper.initGiftNoteToggle();
            }
            
            // Reinitialize recommendations swiper after updating sections  
            if (cartDrawerWrapper && typeof cartDrawerWrapper.initRecommendationsSwiper === 'function') {
              cartDrawerWrapper.initRecommendationsSwiper();
            }
            
            const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
            let message = '';
            if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
              if (typeof updatedValue === 'undefined') {
                message = window.cartStrings.error;
              } else {
                message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
              }
            }
            this.updateLiveRegions(line, message);

            const lineItem =
              document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
            if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
              cartDrawerWrapper
                ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
                : lineItem.querySelector(`[name="${name}"]`).focus();
            } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
              trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
            } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
              trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
            }
          });

          CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
        })
        .catch((error) => {
          console.error('updateQuantity - fetch error:', error);
          this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
          const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
          errors.textContent = window.cartStrings.error;
        })
        .finally(() => {
          this.disableLoading(line);
        });
    }
    
    getSectionInnerHTML(html, selector) {
      if (!html) {
        console.error('CartDrawerItems getSectionInnerHTML - html is null or undefined');
        return '';
      }
      const element = new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector);
      if (!element) {
        console.error('CartDrawerItems getSectionInnerHTML - selector not found:', selector);
        return '';
      }
      return element.innerHTML;
    }
  }

  customElements.define('cart-drawer-items', CartDrawerItems);
}

// Add Sample functionality
class CartDrawerAddSample extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => {
      event.preventDefault()
      this.setAttribute('disabled', true)
      this.classList.add('loading')
      const dataJson = this.dataset.layer ? JSON.parse(this.dataset.layer) : {}
      
      // Trigger analytics if you have it
      if (typeof trigger !== 'undefined') {
        trigger('productAddToCart', document, { product: dataJson, list: 'Mini Cart - Samples' })
      }
      
      const id = this.dataset.sampleId
      const body = JSON.stringify({
        items: [{
          id: id,
          quantity: 1
        }],
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      })
      
      fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          this.updateSections(parsedState)
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.classList.remove('loading')
          this.removeAttribute('disabled')
        })
    })
  }
  
  getSectionsToRender() {
    const cartDrawer = document.getElementById('CartDrawer');
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer';
    
    // Fallback to 'cart-drawer' if sectionId is empty
    if (!sectionId || sectionId === '') {
      sectionId = 'cart-drawer';
    }
    
    console.log('Sample component getSectionsToRender - sectionId:', sectionId);
    
    return [
      {
        id: 'CartDrawer',
        section: sectionId,
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ]
  }
  
  updateSections(parsedState) {
    if (!parsedState.sections) {
      console.warn('Sample component - No sections in response')
      return
    }
    this.getSectionsToRender().forEach((section => {
      const sectionHtml = parsedState.sections[section.section]
      if (!sectionHtml) {
        console.warn('Sample component - Section HTML is null for:', section.section)
        return
      }
      const elementToReplace = document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id)
      if (elementToReplace) {
        elementToReplace.innerHTML = this.getSectionInnerHTML(sectionHtml, section.selector)
      }
    }))
    
    // Reinitialize recommendations swiper after updating sections
    const cartDrawer = document.querySelector('cart-drawer')
    if (cartDrawer && typeof cartDrawer.initRecommendationsSwiper === 'function') {
      setTimeout(() => cartDrawer.initRecommendationsSwiper(), 100)
    }
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('Sample component getSectionInnerHTML - html is null or undefined');
      return '';
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    if (!element) {
      console.error('Sample component getSectionInnerHTML - selector not found:', selector);
      return '';
    }
    return element.innerHTML;
  }
}

customElements.define('cart-drawer-add-sample', CartDrawerAddSample)

// Remove Sample functionality
class CartDrawerRemoveSample extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => {
      event.preventDefault()
      const dataJson = this.dataset.layer ? JSON.parse(this.dataset.layer) : {}
      
      // Trigger analytics if you have it
      if (typeof trigger !== 'undefined') {
        trigger('removeFromCart', document, { product: dataJson })
      }
      
      this.setAttribute('disabled', true)
      this.classList.add('loading')
      
      const id = this.dataset.sampleId
      
      const body = JSON.stringify({
        id: id,
        quantity: 0,
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      })
      
      fetch(`${routes.cart_change_url}`, { ...fetchConfig('javascript'), ...{ body } })
        .then((response) => response.json())
        .then((parsedState) => {
          this.updateSections(parsedState)
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.classList.remove('loading')
          this.removeAttribute('disabled')
        })
    })
  }
  
  getSectionsToRender() {
    const cartDrawer = document.getElementById('CartDrawer');
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer';
    
    // Fallback to 'cart-drawer' if sectionId is empty
    if (!sectionId || sectionId === '') {
      sectionId = 'cart-drawer';
    }
    
    console.log('Sample component getSectionsToRender - sectionId:', sectionId);
    
    return [
      {
        id: 'CartDrawer',
        section: sectionId,
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ]
  }
  
  updateSections(parsedState) {
    if (!parsedState.sections) {
      console.warn('Remove sample component - No sections in response')
      return
    }
    this.getSectionsToRender().forEach((section => {
      const sectionHtml = parsedState.sections[section.section]
      if (!sectionHtml) {
        console.warn('Remove sample component - Section HTML is null for:', section.section)
        return
      }
      const elementToReplace = document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id)
      if (elementToReplace) {
        elementToReplace.innerHTML = this.getSectionInnerHTML(sectionHtml, section.selector)
      }
    }))
    
    // Reinitialize recommendations swiper after updating sections
    const cartDrawer = document.querySelector('cart-drawer')
    if (cartDrawer && typeof cartDrawer.initRecommendationsSwiper === 'function') {
      setTimeout(() => cartDrawer.initRecommendationsSwiper(), 100)
    }
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('Sample component getSectionInnerHTML - html is null or undefined');
      return '';
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    if (!element) {
      console.error('Sample component getSectionInnerHTML - selector not found:', selector);
      return '';
    }
    return element.innerHTML;
  }
}

customElements.define('cart-drawer-remove-sample', CartDrawerRemoveSample);

// Add Recommendation functionality (one-time purchase)
class CartDrawerAddRecommendation extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => {
      event.preventDefault()
      if (this.hasAttribute('disabled')) return
      
      this.setAttribute('disabled', true)
      this.classList.add('loading')
      const button = this.querySelector('.recommendation-card__button')
      if (button) {
        button.disabled = true
      }
      
      const dataJson = this.dataset.layer ? JSON.parse(this.dataset.layer) : {}
      
      // Trigger analytics if you have it
      if (typeof trigger !== 'undefined') {
        trigger('productAddToCart', document, { product: dataJson, list: 'Mini Cart - Recommendations' })
      }
      
      const variantId = this.dataset.variantId
      const body = JSON.stringify({
        items: [{
          id: variantId,
          quantity: 1
        }],
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      })
      
      fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          // Check if the response is an error (status 422 for sold out)
          if (parsedState.status === 422) {
            console.warn('Product unavailable:', parsedState.message)
            // Show user-friendly error message
            const errors = document.getElementById('CartDrawer-CartErrors')
            if (errors) {
              errors.textContent = parsedState.message || 'This product is currently unavailable.'
              setTimeout(() => {
                errors.textContent = ''
              }, 3000)
            }
            // Hide the sold-out product from recommendations
            this.closest('.swiper-slide')?.remove()
            return
          }
          
          this.updateSections(parsedState)
          // Reinitialize swiper after update
          const cartDrawer = document.querySelector('cart-drawer')
          if (cartDrawer && typeof cartDrawer.initRecommendationsSwiper === 'function') {
            setTimeout(() => cartDrawer.initRecommendationsSwiper(), 100)
          }
        })
        .catch((e) => {
          console.error('Failed to add product to cart:', e)
          // Show error message
          const errors = document.getElementById('CartDrawer-CartErrors')
          if (errors) {
            errors.textContent = 'Failed to add product to cart. Please try again.'
            setTimeout(() => {
              errors.textContent = ''
            }, 3000)
          }
        })
        .finally(() => {
          this.classList.remove('loading')
          this.removeAttribute('disabled')
          if (button) {
            button.disabled = false
          }
        })
    })
  }
  
  getSectionsToRender() {
    const cartDrawer = document.getElementById('CartDrawer')
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer'
    
    if (!sectionId || sectionId === '') {
      sectionId = 'cart-drawer'
    }
    
    return [
      {
        id: 'CartDrawer',
        section: sectionId,
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ]
  }
  
  updateSections(parsedState) {
    if (!parsedState.sections) {
      console.warn('Recommendation component - No sections in response')
      return
    }
    this.getSectionsToRender().forEach((section => {
      const sectionHtml = parsedState.sections[section.section]
      if (!sectionHtml) {
        console.warn('Recommendation component - Section HTML is null for:', section.section)
        return
      }
      const elementToReplace = document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id)
      if (elementToReplace) {
        elementToReplace.innerHTML = this.getSectionInnerHTML(sectionHtml, section.selector)
      }
    }))
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('Recommendation component getSectionInnerHTML - html is null or undefined')
      return ''
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector)
    if (!element) {
      console.error('Recommendation component getSectionInnerHTML - selector not found:', selector)
      return ''
    }
    return element.innerHTML
  }
}

customElements.define('cart-drawer-add-recommendation', CartDrawerAddRecommendation)

// Add Subscription functionality (subscription purchase)
class CartDrawerAddSubscription extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', (event) => {
      event.preventDefault()
      if (this.hasAttribute('disabled')) return
      
      this.setAttribute('disabled', true)
      this.classList.add('loading')
      const button = this.querySelector('.recommendation-card__button')
      if (button) {
        button.disabled = true
      }
      
      const dataJson = this.dataset.layer ? JSON.parse(this.dataset.layer) : {}
      
      // Trigger analytics if you have it
      if (typeof trigger !== 'undefined') {
        trigger('productAddToCart', document, { product: dataJson, list: 'Mini Cart - Recommendations Subscription' })
      }
      
      const variantId = this.dataset.variantId
      const sellingPlanId = this.dataset.sellingPlanId
      
      const body = JSON.stringify({
        items: [{
          id: variantId,
          quantity: 1,
          selling_plan: sellingPlanId
        }],
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      })
      
      fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          // Check if the response is an error (status 422 for sold out)
          if (parsedState.status === 422) {
            console.warn('Product unavailable:', parsedState.message)
            // Show user-friendly error message
            const errors = document.getElementById('CartDrawer-CartErrors')
            if (errors) {
              errors.textContent = parsedState.message || 'This product is currently unavailable.'
              setTimeout(() => {
                errors.textContent = ''
              }, 3000)
            }
            // Hide the sold-out product from recommendations
            this.closest('.swiper-slide')?.remove()
            return
          }
          
          this.updateSections(parsedState)
          // Reinitialize swiper after update
          const cartDrawer = document.querySelector('cart-drawer')
          if (cartDrawer && typeof cartDrawer.initRecommendationsSwiper === 'function') {
            setTimeout(() => cartDrawer.initRecommendationsSwiper(), 100)
          }
        })
        .catch((e) => {
          console.error('Failed to add subscription to cart:', e)
          // Show error message
          const errors = document.getElementById('CartDrawer-CartErrors')
          if (errors) {
            errors.textContent = 'Failed to add subscription to cart. Please try again.'
            setTimeout(() => {
              errors.textContent = ''
            }, 3000)
          }
        })
        .finally(() => {
          this.classList.remove('loading')
          this.removeAttribute('disabled')
          if (button) {
            button.disabled = false
          }
        })
    })
  }
  
  getSectionsToRender() {
    const cartDrawer = document.getElementById('CartDrawer')
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer'
    
    if (!sectionId || sectionId === '') {
      sectionId = 'cart-drawer'
    }
    
    return [
      {
        id: 'CartDrawer',
        section: sectionId,
        selector: '.drawer__inner'
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ]
  }
  
  updateSections(parsedState) {
    if (!parsedState.sections) {
      console.warn('Subscription component - No sections in response')
      return
    }
    this.getSectionsToRender().forEach((section => {
      const sectionHtml = parsedState.sections[section.section]
      if (!sectionHtml) {
        console.warn('Subscription component - Section HTML is null for:', section.section)
        return
      }
      const elementToReplace = document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id)
      if (elementToReplace) {
        elementToReplace.innerHTML = this.getSectionInnerHTML(sectionHtml, section.selector)
      }
    }))
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('Subscription component getSectionInnerHTML - html is null or undefined')
      return ''
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector)
    if (!element) {
      console.error('Subscription component getSectionInnerHTML - selector not found:', selector)
      return ''
    }
    return element.innerHTML
  }
}

customElements.define('cart-drawer-add-subscription', CartDrawerAddSubscription)

// Subscription Toggle functionality
class CartSubscriptionToggle {
  constructor() {
    this.initialized = false;
    this.initializeToggles();
  }

  initializeToggles() {
    // Only bind events once
    if (this.initialized) return;
    this.initialized = true;

    // Initialize subscription toggle buttons
    document.addEventListener('click', (event) => {
      // Handle info icon click for tooltip
      const infoIcon = event.target.closest('.subscription-info-icon-cart');
      if (infoIcon) {
        event.preventDefault();
        event.stopPropagation();

        const wrapper = infoIcon.closest('.subscription-cart-item-wrapper');
        const tooltip = wrapper ? wrapper.nextElementSibling : null;

        if (tooltip && tooltip.classList.contains('subscription-info-tooltip-cart')) {
          tooltip.classList.toggle('active');
          console.log('Cart drawer: Tooltip toggled');
        }
        return;
      }

      // Handle subscription toggle button click (but not the info icon)
      const toggleBtn = event.target.closest('.subscription-toggle-btn');
      if (!toggleBtn || event.target.closest('.subscription-info-icon-cart')) return;

      event.preventDefault();
      const wrapper = toggleBtn.closest('.subscription-cart-item-wrapper.subscription-toggle');
      if (!wrapper) return;

      const line = wrapper.dataset.line;
      const variantId = wrapper.dataset.variantId;
      const sellingPlanId = wrapper.dataset.sellingPlanId;

      this.toggleSubscription(line, variantId, sellingPlanId, toggleBtn);
    });

    // Close tooltip when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.subscription-info-icon-cart') &&
          !event.target.closest('.subscription-info-tooltip-cart')) {
        const activeTooltips = document.querySelectorAll('.subscription-info-tooltip-cart.active');
        activeTooltips.forEach(tooltip => {
          tooltip.classList.remove('active');
        });
      }
    });
  }

  reinitialize() {
    // Close any open tooltips after cart update
    const activeTooltips = document.querySelectorAll('.subscription-info-tooltip-cart.active');
    activeTooltips.forEach(tooltip => {
      tooltip.classList.remove('active');
    });
  }
  
  toggleSubscription(line, variantId, sellingPlanId, button) {
    // Disable button and show loading state
    button.disabled = true;
    button.classList.add('loading');
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').textContent = 'Updating...';
    
    const cartDrawer = document.getElementById('CartDrawer');
    let sectionId = cartDrawer && cartDrawer.dataset.id ? cartDrawer.dataset.id : 'cart-drawer';
    
    // Build the request body
    const body = JSON.stringify({
      line: parseInt(line),
      selling_plan: sellingPlanId,
      sections: [sectionId, 'cart-icon-bubble'],
      sections_url: window.location.pathname
    });
    
    console.log('Toggling subscription:', { line, variantId, sellingPlanId });
    
    // Send the update request
    fetch(`${routes.cart_change_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update cart');
      }
      return response.json();
    })
    .then(parsedState => {
      console.log('Subscription toggle successful:', parsedState);
      
      // Update the cart drawer sections
      this.updateSections(parsedState);
      
      // Reinitialize the cart drawer if needed
      const cartDrawerElement = document.querySelector('cart-drawer');
      if (cartDrawerElement && typeof cartDrawerElement.initGiftNoteToggle === 'function') {
        cartDrawerElement.initGiftNoteToggle();
      }
      
      // Reinitialize toggles after DOM update
      setTimeout(() => {
        this.initializeToggles();
        
        // Reinitialize recommendations swiper after updating sections
        const cartDrawerElement = document.querySelector('cart-drawer');
        if (cartDrawerElement && typeof cartDrawerElement.initRecommendationsSwiper === 'function') {
          cartDrawerElement.initRecommendationsSwiper();
        }
      }, 100);
    })
    .catch(error => {
      console.error('Error toggling subscription:', error);
      // Restore button state
      button.disabled = false;
      button.classList.remove('loading');
      button.querySelector('span').textContent = originalText;
      
      // Show error message to user
      const errors = document.getElementById('CartDrawer-CartErrors');
      if (errors) {
        errors.textContent = 'Failed to update subscription. Please try again.';
        setTimeout(() => {
          errors.textContent = '';
        }, 3000);
      }
    });
  }
  
  updateSections(parsedState) {
    // Update cart drawer section
    const cartDrawer = document.getElementById('CartDrawer');
    const drawerInner = cartDrawer?.querySelector('.drawer__inner');
    
    if (drawerInner && parsedState.sections['cart-drawer']) {
      const newContent = this.getSectionInnerHTML(parsedState.sections['cart-drawer'], '.drawer__inner');
      if (newContent) {
        drawerInner.innerHTML = newContent;
      }
    }
    
    // Update cart icon bubble
    const cartIconBubble = document.getElementById('cart-icon-bubble');
    if (cartIconBubble && parsedState.sections['cart-icon-bubble']) {
      const newContent = this.getSectionInnerHTML(parsedState.sections['cart-icon-bubble'], '.shopify-section');
      if (newContent) {
        const section = cartIconBubble.querySelector('.shopify-section');
        if (section) {
          section.innerHTML = newContent;
        }
      }
    }
  }
  
  getSectionInnerHTML(html, selector) {
    if (!html) {
      console.error('CartSubscriptionToggle getSectionInnerHTML - html is null or undefined');
      return '';
    }
    const element = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    if (!element) {
      console.error('CartSubscriptionToggle getSectionInnerHTML - selector not found:', selector);
      return '';
    }
    return element.innerHTML;
  }
}

// Cart Quantity Input - Special handling for cart drawer quantity inputs
class CartQuantityInput extends QuantityInput {
  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    
    // Special handling for minus button when quantity is 1
    if (event.target.name === 'minus' && parseInt(previousValue) === 1) {
      // Find the closest cart item row and its remove button
      const cartItem = this.closest('tr.cart-item');
      if (cartItem) {
        // Find the remove button and trigger it
        const removeButton = cartItem.querySelector('cart-remove-button button');
        if (removeButton) {
          removeButton.click();
          return;
        }
        
        // Fallback: directly update quantity to 0
        const cartItems = this.closest('cart-drawer-items');
        const index = this.input.dataset.index;
        if (cartItems && index) {
          cartItems.updateQuantity(index, 0, event);
          return;
        }
      }
    }
    
    // Default behavior for all other cases
    super.onButtonClick(event);
  }
}

// Register the custom element
customElements.define('cart-quantity-input', CartQuantityInput);

// Initialize subscription toggle functionality when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.subscriptionTooltipManager = new CartSubscriptionToggle();
  });
} else {
  window.subscriptionTooltipManager = new CartSubscriptionToggle();
}
