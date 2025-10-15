class FragranceFilter {
  constructor() {
    this.filterSwatches = document.querySelectorAll('.nue-fragrance-filter__item');
    this.productCards = document.querySelectorAll('.card-product-nue');
    this.activeFilters = new Set();
    this.modal = document.getElementById('nueFragranceModal');
    
    this.init();
  }
  
  init() {
    if (!this.filterSwatches.length || !this.productCards.length) return;
    
    // Add click handlers to filter swatches
    this.filterSwatches.forEach(swatch => {
      swatch.style.cursor = 'pointer';
      swatch.addEventListener('click', (e) => this.handleSwatchClick(e, swatch));
    });
    
    // Add data attributes to product cards for filtering
    this.prepareProductCards();
    
    // Check URL parameters and auto-activate filters
    this.checkURLParams();
    
    // Initialize modal if it exists
    if (this.modal) {
      this.initModal();
    }
  }
  
  initModal() {
    const modalClose = this.modal.querySelector('.nue-fragrance-modal-close');
    
    // Close button handler
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
    
    // Overlay click handler
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.style.display === 'flex') {
        this.closeModal();
      }
    });
  }
  
  openModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }
  
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
  
  handleSwatchClick(e, swatch) {
    const shouldOpenModal = swatch.dataset.openModal === 'true';
    
    if (shouldOpenModal) {
      e.preventDefault();
      this.openModal();
    } else {
      this.toggleFilter(swatch);
    }
  }
  
  checkURLParams() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check for modal parameter
    const showModal = urlParams.get('modal');
    if (showModal === 'true' || showModal === 'open') {
      this.openModal();
    }

    const filterName = urlParams.get('filter');

    if (filterName) {
      // Find and activate the matching filter swatch
      this.filterSwatches.forEach(swatch => {
        const filterLabel = swatch.querySelector('.nue-fragrance-filter__label');
        if (filterLabel && filterLabel.textContent.trim() === filterName) {
          // Activate this filter
          this.activeFilters.add(filterName);
          swatch.classList.add('active');
        }
      });
      
      // Apply the filters to show matching products
      if (this.activeFilters.size > 0) {
        this.applyFilters();
      }
    }
  }
  
  toggleFilter(swatch) {
    const filterTitle = swatch.querySelector('.nue-fragrance-filter__label')?.textContent?.trim();
    if (!filterTitle) return;
    
    if (this.activeFilters.has(filterTitle)) {
      this.activeFilters.delete(filterTitle);
      swatch.classList.remove('active');
    } else {
      this.activeFilters.add(filterTitle);
      swatch.classList.add('active');
    }
    
    this.applyFilters();
  }
  
  prepareProductCards() {
    this.productCards.forEach(card => {
      const swatchLabels = card.querySelectorAll('.card-product-nue__swatch-label');
      const fragrances = Array.from(swatchLabels).map(label => label.textContent.trim());
      card.dataset.fragrances = JSON.stringify(fragrances);
    });
  }
  
  applyFilters() {
    // Update product card swatch active states
    this.productCards.forEach(card => {
      const swatchItems = card.querySelectorAll('.card-product-nue__swatch-item');
      swatchItems.forEach(item => {
        const label = item.querySelector('.card-product-nue__swatch-label');
        if (label) {
          const fragranceName = label.textContent.trim();
          if (this.activeFilters.has(fragranceName)) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        }
      });
    });
    
    if (this.activeFilters.size === 0) {
      // No filters active, show all products
      this.productCards.forEach(card => {
        const listItem = card.closest('li');
        if (listItem) {
          listItem.style.display = '';
        }
      });
      return;
    }
    
    // Apply filters
    this.productCards.forEach(card => {
      const listItem = card.closest('li');
      if (!listItem) return;
      
      const cardFragrances = JSON.parse(card.dataset.fragrances || '[]');
      const hasMatchingFragrance = cardFragrances.some(fragrance => 
        this.activeFilters.has(fragrance)
      );
      
      listItem.style.display = hasMatchingFragrance ? '' : 'none';
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new FragranceFilter());
} else {
  new FragranceFilter();
}