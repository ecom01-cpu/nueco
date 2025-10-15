function initproductCarousel() {
  const productSwiper = document.querySelector('.nue-product-swiper');
  if (!productSwiper) return;

  // Destroy existing swiper instance if it exists
  if (window.productSwiperInstance) {
    window.productSwiperInstance.destroy(true, true);
  }

  // Initialize new swiper
  window.productSwiperInstance = new Swiper('.nue-product-swiper', {
    slidesPerView: 1,
    spaceBetween: 16,
    centeredSlides: false,
    loop: false,
    autoplay: false,
    autoHeight: false, // Keep false to maintain equal heights
    grabCursor: true,
    touchEventsTarget: 'container',
    breakpoints: {
      750: {
        slidesPerView: 1.11,
        spaceBetween: 48,
      }
    }
  });

  const navPills = document.querySelectorAll('.nue-product-nav-pill');

  navPills.forEach((pill) => {
    pill.addEventListener('click', function () {
      const slideIndex = parseInt(this.getAttribute('data-slide'));
      window.productSwiperInstance.slideTo(slideIndex);

      navPills.forEach((p) => p.classList.remove('active'));
      this.classList.add('active');
    });
  });

  window.productSwiperInstance.on('slideChange', function () {
    const activeIndex = window.productSwiperInstance.activeIndex;
    navPills.forEach((pill, index) => {
      pill.classList.toggle('active', index === activeIndex);
    });
    
    // Trigger timeline animations when timeline slide becomes active
    const activeSlide = window.productSwiperInstance.slides[activeIndex];
    const timelineWrapper = activeSlide?.querySelector('.nue-product-timeline-wrapper');
    if (timelineWrapper) {
      // Reset and trigger animations
      const dots = timelineWrapper.querySelectorAll('.nue-product-timeline-dot');
      dots.forEach((dot) => {
        dot.style.animation = 'none';
        setTimeout(() => {
          dot.style.animation = '';
        }, 50);
      });
    }
  });
  
  // Trigger animation for initially active timeline slide
  const initialSlide = window.productSwiperInstance.slides[0];
  const initialTimeline = initialSlide?.querySelector('.nue-product-timeline-wrapper');
  if (initialTimeline) {
    const dots = initialTimeline.querySelectorAll('.nue-product-timeline-dot');
    dots.forEach((dot) => {
      dot.style.animation = '';
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initproductCarousel);

// Reinitialize when theme editor changes sections
if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', function(event) {
    if (event.target.querySelector('.nue-product-swiper')) {
      setTimeout(initproductCarousel, 100);
    }
  });

  document.addEventListener('shopify:block:select', function(event) {
    if (event.target.closest('.nue-product-swiper')) {
      const slideIndex = Array.from(event.target.parentNode.children).indexOf(event.target);
      if (window.productSwiperInstance) {
        window.productSwiperInstance.slideTo(slideIndex);
      }
    }
  });
}
