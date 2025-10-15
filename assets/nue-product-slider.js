function initNueProductSlider() {
  const sliderEl = document.querySelector('.nue-product-slider');
  if (!sliderEl) return;

  console.log('🎬 Initializing Nue Product Slider');

  // Destroy existing instance
  if (window.nueProductSliderInstance) {
    console.log('🗑️ Destroying existing slider instance');
    window.nueProductSliderInstance.destroy(true, true);
  }

  let autoplayTimeout;
  let isDragging = false;
  let dragStartTime = 0;
  const isMobile = window.innerWidth < 750;

  // Initialize with hard-coded settings for smooth continuous scroll
  window.nueProductSliderInstance = new Swiper('.nue-product-slider', {
    slidesPerView: 'auto',
    spaceBetween: 20,
    loop: true, // Enable loop on both mobile and desktop
    loopAdditionalSlides: 10, // Ensure smooth looping
    speed: isMobile ? 8000 : 15000, // Smooth continuous scroll on both mobile and desktop
    allowTouchMove: true,
    grabCursor: true,
    resistanceRatio: 0,
    followFinger: true,
    threshold: 5,
    freeMode: { // Enable free mode for smooth scrolling on both mobile and desktop
      enabled: true,
      sticky: false,
      momentum: false,
      momentumRatio: 0,
      momentumVelocityRatio: 0,
      momentumBounce: false,
      momentumBounceRatio: 0
    },
    autoplay: isMobile ? {
      delay: 10, // Minimal delay for continuous effect on mobile
      disableOnInteraction: true, // Stop autoplay when user interacts
      pauseOnMouseEnter: false, // No mouse hover on mobile
      waitForTransition: true,
      stopOnLastSlide: false,
      reverseDirection: false
    } : { // Desktop continuous scroll settings
      delay: 10,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
      waitForTransition: true,
      stopOnLastSlide: false,
      reverseDirection: false
    },
    breakpoints: {
      320: {
        slidesPerView: 2.5,
        spaceBetween: 10,
        speed: 8000 // Smooth scroll speed for mobile
      },
      750: {
        slidesPerView: 4.5,
        spaceBetween: 20,

      },
      1200: {
        slidesPerView: 3.5,
        spaceBetween: 20,

      },
      1500: {
        slidesPerView: 5.5,
        spaceBetween: 20,

      }
    },
    on: {
      init: function() {
        console.log('✅ Swiper initialized');
        this.el.classList.add('swiper-continuous');
        console.log('🔄 Autoplay status:', this.autoplay.running ? 'RUNNING' : 'STOPPED');
      },
      touchStart: function(e) {
        if (!isMobile) {
          // Desktop only - custom behavior
          console.log('👆 Touch/Drag START (Desktop)');
          isDragging = true;
          dragStartTime = Date.now();
          clearTimeout(autoplayTimeout);
          
          this.autoplay.stop();
          this.setTransition(0);
          this.setTranslate(this.getTranslate());
          
          console.log('⏸️ Autoplay STOPPED');
        }
      },
      touchMove: function() {
        if (!isMobile) {
          isDragging = true;
          clearTimeout(autoplayTimeout);
        }
      },
      touchEnd: function() {
        if (!isMobile) {
          // Desktop only - custom behavior
          console.log('👆 Touch/Drag END (Desktop)');
          const swiper = this;
          
          const dragDuration = Date.now() - dragStartTime;
          console.log(`⏱️ Drag duration: ${dragDuration}ms`);
          
          // Stop completely
          swiper.setTransition(0);
          if (swiper.freeMode) swiper.freeMode.enabled = false;
          const currentTranslate = swiper.getTranslate();
          swiper.setTranslate(currentTranslate);
          
          console.log('🛑 Slider LOCKED at position:', currentTranslate);
          
          // Re-enable free mode
          setTimeout(() => {
            if (swiper.freeMode) swiper.freeMode.enabled = true;
          }, 50);
          
          isDragging = false;
          
          clearTimeout(autoplayTimeout);
          
          // Wait 2 seconds, then restart autoplay
          console.log('⏰ Starting 2-second timer before autoplay resume...');
          autoplayTimeout = setTimeout(() => {
            if (!isDragging && swiper.autoplay) {
              console.log('▶️ Restarting autoplay after 2 seconds');
              swiper.autoplay.start();
              console.log('🔄 Autoplay status:', swiper.autoplay.running ? 'RUNNING' : 'STOPPED');
            }
          }, 2000);
        }
      },
      sliderMove: function() {
        if (!isMobile) {
          this.setTransition(0);
        }
      },
      transitionStart: function() {
        if (!isMobile && isDragging) {
          // console.log('🔄 Transition started while dragging - BLOCKING');
          this.setTransition(0);
          const currentTranslate = this.getTranslate();
          this.setTranslate(currentTranslate);
        }
      },
      transitionEnd: function() {
        if (!isMobile && isDragging) {
          // console.log('🔄 Transition ended while dragging - BLOCKING');
          this.setTransition(0);
          const currentTranslate = this.getTranslate();
          this.setTranslate(currentTranslate);
        }
      },
      autoplayStart: function() {
        // console.log('🟢 Autoplay STARTED');
      },
      autoplayStop: function() {
        // console.log('🔴 Autoplay STOPPED');
      },
      autoplayPause: function() {
        // console.log('⏸️ Autoplay PAUSED');
      },
      autoplayResume: function() {
        // console.log('▶️ Autoplay RESUMED');
      }
    }
  });

  // Handle mouse drag events (for desktop)
  let isMouseDragging = false;
  let mouseStartX = 0;
  
  if (!isMobile) {
    sliderEl.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // console.log('🖱️ Mouse DOWN - starting drag');
        isMouseDragging = true;
        isDragging = true;
        mouseStartX = e.clientX;
        dragStartTime = Date.now();
        clearTimeout(autoplayTimeout);
        
        if (window.nueProductSliderInstance) {
          window.nueProductSliderInstance.autoplay.stop();
          window.nueProductSliderInstance.setTransition(0);
          const currentTranslate = window.nueProductSliderInstance.getTranslate();
          window.nueProductSliderInstance.setTranslate(currentTranslate);
          // console.log('⏸️ Autoplay stopped via mousedown');
        }
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (isMouseDragging) {
        // console.log('🖱️ Mouse UP - ending drag');
        const dragDistance = Math.abs(e.clientX - mouseStartX);
        const dragDuration = Date.now() - dragStartTime;
        // console.log(`📏 Drag distance: ${dragDistance}px in ${dragDuration}ms`);
        
        isMouseDragging = false;
        isDragging = false;
        
        if (window.nueProductSliderInstance) {
          window.nueProductSliderInstance.setTransition(0);
          window.nueProductSliderInstance.freeMode.enabled = false;
          const currentTranslate = window.nueProductSliderInstance.getTranslate();
          window.nueProductSliderInstance.setTranslate(currentTranslate);
          // console.log('🛑 Mouse release - LOCKED at position:', currentTranslate);
          
          setTimeout(() => {
            if (window.nueProductSliderInstance) {
              window.nueProductSliderInstance.freeMode.enabled = true;
            }
          }, 50);
        }
        
        clearTimeout(autoplayTimeout);
        
        // console.log('⏰ Starting 2-second timer (mouseup)...');
        autoplayTimeout = setTimeout(() => {
          if (!isDragging && window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay) {
            // console.log('▶️ Restarting autoplay after mouseup timeout');
            window.nueProductSliderInstance.autoplay.start();
          }
        }, 2000);
      }
    });

    // Mouse enter/leave for hover pause - DESKTOP ONLY
    sliderEl.addEventListener('mouseenter', () => {
      console.log('🔍 Mouse ENTERED slider area - pausing');
      if (window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay && window.nueProductSliderInstance.autoplay.running) {
        window.nueProductSliderInstance.autoplay.pause();
      }
      console.log('🔄 Autoplay status:', window.nueProductSliderInstance.autoplay.running ? 'RUNNING' : 'STOPPED');
    });

    sliderEl.addEventListener('mouseleave', () => {
      console.log('👋 Mouse LEFT slider area - resuming');
      if (window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay && !isDragging) {
        window.nueProductSliderInstance.autoplay.resume();
      }
      console.log('🔄 Autoplay status:', window.nueProductSliderInstance.autoplay.running ? 'RUNNING' : 'STOPPED');
    });

    // Resume autoplay on page scroll - DESKTOP ONLY
    window.addEventListener('scroll', () => {
      clearTimeout(window.nueProductSliderScrollTimeout);
      
      window.nueProductSliderScrollTimeout = setTimeout(() => {
        console.log('📜 Page scrolled - checking if slider needs to resume');
        
        const rect = sliderEl.getBoundingClientRect();
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isInViewport && window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay && !isDragging) {
          if (!window.nueProductSliderInstance.autoplay.running) {
            console.log('▶️ Resuming autoplay due to scroll');
            window.nueProductSliderInstance.autoplay.start();
          }
        }
      }, 150);
    });
  }

  // Store timeout reference for cleanup
  window.nueProductSliderTimeout = autoplayTimeout;
  
  console.log('✨ Slider initialization complete');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Content Loaded - initializing slider');
  initNueProductSlider();
});

// Reinitialize when theme editor changes sections
if (window.Shopify && Shopify.designMode) {
  console.log('🎨 Shopify Design Mode detected');
  
  document.addEventListener('shopify:section:load', function(event) {
    if (event.target.querySelector('.nue-product-slider')) {
      console.log('🔄 Section loaded - reinitializing slider');
      if (window.nueProductSliderTimeout) {
        clearTimeout(window.nueProductSliderTimeout);
      }
      setTimeout(initNueProductSlider, 100);
    }
  });

  document.addEventListener('shopify:block:select', function(event) {
    if (event.target.closest('.nue-product-slider')) {
      console.log('📦 Block selected in editor');
      if (window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay) {
        window.nueProductSliderInstance.autoplay.stop();
        const slideIndex = Array.from(event.target.parentNode.children).indexOf(event.target);
        window.nueProductSliderInstance.slideTo(slideIndex);
      }
    }
  });

  document.addEventListener('shopify:block:deselect', function(event) {
    if (event.target.closest('.nue-product-slider')) {
      console.log('📦 Block deselected in editor');
      if (window.nueProductSliderInstance && window.nueProductSliderInstance.autoplay) {
        window.nueProductSliderInstance.autoplay.start();
      }
    }
  });

  document.addEventListener('shopify:section:unload', function(event) {
    if (event.target.querySelector('.nue-product-slider')) {
      console.log('🗑️ Section unloading - cleaning up');
      if (window.nueProductSliderTimeout) {
        clearTimeout(window.nueProductSliderTimeout);
      }
      if (window.nueProductSliderScrollTimeout) {
        clearTimeout(window.nueProductSliderScrollTimeout);
      }
      if (window.nueProductSliderInstance) {
        window.nueProductSliderInstance.destroy(true, true);
      }
    }
  });
}