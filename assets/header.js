class StickyHeader {
  constructor() {
    this.header = document.querySelector('.cm-header');
    this.artText = document.querySelector('.cm-art-text-homepage');
    if (!this.header) return;
    
    this.lastScrollTop = 0;
    this.scrollThreshold = 5;
    this.isVisible = true; // Start visible
    
    this.init();
  }
  
  init() {
    // Setup sticky behavior
    this.header.classList.add('cm-header--sticky');
    
    // Create a placeholder to prevent content jump
    this.createPlaceholder();
    
    // Throttled scroll handler
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
    
    // Check initial scroll position
    this.handleScroll();
  }
  
  createPlaceholder() {
    // Create placeholder element to maintain layout
    const placeholder = document.createElement('div');
    placeholder.className = 'cm-header-placeholder';
    placeholder.style.height = this.header.offsetHeight + 'px';
    this.header.parentNode.insertBefore(placeholder, this.header.nextSibling);
  }
  
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove scrolled class for color change
    if (scrollTop > this.scrollThreshold) {
      this.header.classList.add('cm-header--scrolled');
    } else {
      this.header.classList.remove('cm-header--scrolled');
    }
    
    // Hide/show art text on homepage
    if (this.artText) {
      if (scrollTop > 10) {
        this.artText.classList.add('cm-art-text-homepage--hidden');
      } else {
        this.artText.classList.remove('cm-art-text-homepage--hidden');
      }
    }
    
    // Always show header at top of page (within first 20px)
    if (scrollTop <= this.scrollThreshold) {
      this.showHeader();
    } else {
      // Apply hide/show logic immediately after threshold
      if (scrollTop < this.lastScrollTop) {
        // Scrolling up
        this.showHeader();
      } else if (scrollTop > this.lastScrollTop) {
        // Scrolling down
        this.hideHeader();
      }
    }
    
    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
  
  showHeader() {
    if (!this.isVisible) {
      this.header.classList.remove('cm-header--hidden');
      this.header.classList.add('cm-header--visible');
      this.isVisible = true;
    }
  }
  
  hideHeader() {
    if (this.isVisible || this.lastScrollTop <= this.scrollThreshold) {
      this.header.classList.remove('cm-header--visible');
      this.header.classList.add('cm-header--hidden');
      this.isVisible = false;
    }
  }
}

// Mega Menu Class
class MegaMenu {
  constructor() {
    this.menu = document.querySelector('.cm-mega-menu');
    if (!this.menu) return;
    
    this.overlay = this.menu.querySelector('.cm-mega-menu__overlay');
    this.closeBtn = this.menu.querySelector('.cm-mega-menu__close');
    this.hamburger = document.querySelector('.cm-header__hamburger');
    this.swipers = []; // Array to hold multiple swiper instances
    this.isDragging = false; // Track if user is dragging
    
    this.init();
  }
  
  init() {
    // Open menu on hamburger click
    if (this.hamburger) {
      this.hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }
    
    // Close on click outside menu (on the mega menu element itself, but not the container)
    this.menu.addEventListener('click', (e) => {
      // Don't close if we're dragging
      if (!this.isDragging && (e.target === this.menu || e.target === this.overlay)) {
        this.close();
      }
    });
    
    // Track mouse down/up for drag detection
    this.menu.addEventListener('mousedown', () => {
      this.isDragging = false;
    });
    
    this.menu.addEventListener('mousemove', () => {
      this.isDragging = true;
    });
    
    this.menu.addEventListener('mouseup', () => {
      setTimeout(() => {
        this.isDragging = false;
      }, 100);
    });
    
    // Close on close button click
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    
    // Close on Escape key
    document.addEventListener('keyup', (evt) => {
      if (evt.code === 'Escape' && this.menu.classList.contains('active')) {
        this.close();
      }
    });
    
    // Add open method to element for onclick usage
    this.menu.open = () => this.open();
  }
  
  open() {
    // Add animation class with timeout for smooth animation
    setTimeout(() => {
      this.menu.classList.add('animate', 'active');
    });
    
    // Prevent body scroll
    document.body.classList.add('overflow-hidden');
    
    // Initialize all Swipers after menu opens
    setTimeout(() => {
      this.initSwipers();
    }, 100);
  }
  
  initSwipers() {
    if (this.swipers.length > 0) return; // Already initialized
    
    const swiperEls = this.menu.querySelectorAll('.cm-links-swiper');
    if (!swiperEls.length) return;
    
    swiperEls.forEach(swiperEl => {
      // Get card style from the parent element
      const linksSection = swiperEl.closest('.cm-links-section');
      const cardStyle = linksSection ? linksSection.dataset.cardStyle : 'standard';
      
      // Set config based on card style
      let swiperConfig = {
        freeMode: true,
        grabCursor: true,
        slidesOffsetBefore: 15, // 15px padding before first slide
        slidesOffsetAfter: 15,   // 15px padding after last slide
        // Enable mousewheel/trackpad scrolling
        mousewheel: {
          enabled: true,
          forceToAxis: true,        // Horizontal scroll only
          sensitivity: 1,            // Scroll sensitivity
          releaseOnEdges: false,     // Keep scroll within swiper
          thresholdDelta: 6,         // Min delta to trigger scroll
          thresholdTime: 500         // Time window for threshold
        }
      };
      
      switch(cardStyle) {
        case 'small':
          swiperConfig.slidesPerView = 4.7;
          swiperConfig.spaceBetween = 15;
          break;
        case 'large':
          swiperConfig.slidesPerView = 2.4;
          swiperConfig.spaceBetween = 10;
          break;
        default: // standard
          swiperConfig.slidesPerView = 2.7;
          swiperConfig.spaceBetween = 15;
      }
      
      const swiper = new Swiper(swiperEl, swiperConfig);
      
      // Prevent menu close while dragging swiper
      swiper.on('touchStart', () => {
        this.isDragging = true;
      });
      
      swiper.on('touchEnd', () => {
        setTimeout(() => {
          this.isDragging = false;
        }, 100);
      });
      
      this.swipers.push(swiper);
    });
  }
  
  close() {
    this.menu.classList.remove('active');
    
    // Re-enable body scroll
    document.body.classList.remove('overflow-hidden');
    
    // Remove animate class after transition
    setTimeout(() => {
      this.menu.classList.remove('animate');
    }, 300);
  }
}

// Enhanced Cart Count Sync
class CartCountSync {
  constructor() {
    this.syncDebounceTimer = null;
    this.init();
  }
  
  init() {
    // Watch for changes to the Dawn cart-icon-bubble and sync to cm-header
    this.observeCartBubble();
    
    // Listen for various cart events
    this.listenForCartEvents();
    
    // Periodic sync as fallback (every 500ms when cart drawer is open)
    this.setupPeriodicSync();
  }
  
  observeCartBubble() {
    // Find the Dawn cart bubble element
    const cartIconBubble = document.getElementById('cart-icon-bubble');
    if (!cartIconBubble) return;
    
    // Create observer to watch for changes with more specific configuration
    const observer = new MutationObserver((mutations) => {
      // Debounce the sync to avoid excessive updates
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = setTimeout(() => {
        this.syncCartCount();
      }, 50);
    });
    
    // Observe changes to the cart bubble and its parent section
    const cartSection = document.getElementById('shopify-section-cart-icon-bubble') || cartIconBubble;
    observer.observe(cartSection, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-cart-count']
    });
    
    // Initial sync
    this.syncCartCount();
  }
  
  listenForCartEvents() {
    // Listen for custom cart events that might be dispatched
    ['cart:updated', 'cart:change', 'cart:refresh'].forEach(eventName => {
      document.addEventListener(eventName, () => {
        setTimeout(() => this.syncCartCount(), 100);
      });
    });
    
    // Listen for AJAX complete events that might indicate cart updates
    if (window.jQuery) {
      jQuery(document).ajaxComplete((event, xhr, settings) => {
        if (settings.url && (settings.url.includes('/cart') || settings.url.includes('/change'))) {
          setTimeout(() => this.syncCartCount(), 200);
        }
      });
    }
    
    // Listen for fetch requests completion (modern approach)
    const self = this;
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        const url = args[0];
        if (url && (url.includes('/cart') || url.includes('/change'))) {
          setTimeout(() => {
            self.syncCartCount();
          }, 200);
        }
        return response;
      });
    };
  }
  
  setupPeriodicSync() {
    // Check if cart drawer is open and sync periodically
    let lastDrawerState = false;
    setInterval(() => {
      const cartDrawer = document.querySelector('cart-drawer');
      const isDrawerOpen = cartDrawer && (cartDrawer.classList.contains('active') || cartDrawer.classList.contains('animate'));
      
      // Sync when drawer opens or while it's open
      if (isDrawerOpen) {
        this.syncCartCount();
      }
      
      // Also sync once when drawer closes
      if (!isDrawerOpen && lastDrawerState) {
        setTimeout(() => this.syncCartCount(), 300);
      }
      
      lastDrawerState = isDrawerOpen;
    }, 500);
  }
  
  syncCartCount() {
    // Try multiple methods to get the current cart count
    let count = 0;
    
    // Method 1: Get count from Dawn's cart bubble
    const cartBubble = document.querySelector('#cart-icon-bubble .cart-count-bubble span[aria-hidden="true"]');
    if (cartBubble && cartBubble.textContent) {
      count = parseInt(cartBubble.textContent) || 0;
    }
    
    // Method 2: Get count from cart drawer if bubble not found
    if (!cartBubble) {
      const cartDrawerCount = document.querySelector('[data-cart-count]');
      if (cartDrawerCount && cartDrawerCount.textContent) {
        count = parseInt(cartDrawerCount.textContent) || 0;
      }
    }
    
    // Method 3: Try to get from Shopify cart object if available
    if (!count && window.cart && window.cart.item_count !== undefined) {
      count = window.cart.item_count;
    }
    
    // Update cm-header
    const cmIndicator = document.querySelector('.cm-header__cart-indicator');
    const cmCountElement = document.querySelector('.cm-header__cart-count');
    
    if (!cmIndicator) return;
    
    if (count > 0) {
      cmIndicator.classList.add('cm-header__cart-indicator--has-items');
      if (cmCountElement) {
        cmCountElement.textContent = count;
      } else {
        // Create the count element if it doesn't exist
        const newCountElement = document.createElement('span');
        newCountElement.className = 'cm-header__cart-count';
        newCountElement.textContent = count;
        cmIndicator.appendChild(newCountElement);
      }
    } else {
      cmIndicator.classList.remove('cm-header__cart-indicator--has-items');
      if (cmCountElement) {
        cmCountElement.remove();
      }
    }
  }
}

// Initialize when DOM is ready
let cartCountSyncInstance = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new StickyHeader();
    new MegaMenu();
    if (!cartCountSyncInstance) {
      cartCountSyncInstance = new CartCountSync();
    }
  });
} else {
  new StickyHeader();
  new MegaMenu();
  if (!cartCountSyncInstance) {
    cartCountSyncInstance = new CartCountSync();
  }
}