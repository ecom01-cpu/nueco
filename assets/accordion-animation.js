/**
 * Smooth accordion animation handler
 * Provides subtle open/close animations for accordion/collapsible elements
 */

class AccordionAnimation {
  constructor() {
    this.accordions = [];
    this.animationDuration = 350; // milliseconds
    this.init();
  }

  init() {
    // Find all accordion elements across different sections
    const accordionSelectors = [
      '.accordion details',
      '.product__accordion details',
      '.nue-collapsible-content .accordion details'
    ];

    accordionSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(details => {
        if (!details.hasAttribute('data-animated')) {
          this.setupAccordion(details);
          details.setAttribute('data-animated', 'true');
        }
      });
    });
  }

  setupAccordion(details) {
    const summary = details.querySelector('summary');
    const content = details.querySelector('.accordion__content, .accordion__content.rte');
    
    if (!summary || !content) return;

    // Store original display and height values
    let isAnimating = false;

    // Create wrapper for content to animate
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'accordion-animation-wrapper';
    content.parentNode.insertBefore(contentWrapper, content);
    contentWrapper.appendChild(content);

    // Set initial styles
    contentWrapper.style.overflow = 'hidden';
    contentWrapper.style.transition = `height ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

    // Handle the toggle animation
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (isAnimating) return;
      
      const isOpen = details.hasAttribute('open');
      isAnimating = true;

      if (isOpen) {
        // Closing animation
        this.closeAccordion(details, contentWrapper, () => {
          isAnimating = false;
        });
      } else {
        // Opening animation
        this.openAccordion(details, contentWrapper, () => {
          isAnimating = false;
        });
      }
    });

    // Set initial state
    if (details.hasAttribute('open')) {
      contentWrapper.style.height = 'auto';
    } else {
      contentWrapper.style.height = '0px';
    }
  }

  openAccordion(details, wrapper, callback) {
    // First, set the open attribute to measure content height
    details.setAttribute('open', '');
    
    // Get the full height of the content
    const fullHeight = wrapper.scrollHeight;
    
    // Start from 0
    wrapper.style.height = '0px';
    
    // Force reflow
    wrapper.offsetHeight;
    
    // Animate to full height
    wrapper.style.height = fullHeight + 'px';
    
    // Add fade-in effect to content
    const content = wrapper.firstElementChild;
    content.style.opacity = '0';
    content.style.transition = `opacity ${this.animationDuration}ms ease-in-out`;
    
    setTimeout(() => {
      content.style.opacity = '1';
    }, 50);
    
    // After animation completes, set height to auto for responsive behavior
    setTimeout(() => {
      wrapper.style.height = 'auto';
      callback();
    }, this.animationDuration);
  }

  closeAccordion(details, wrapper, callback) {
    // Get current height
    const currentHeight = wrapper.scrollHeight;
    
    // Set explicit height to enable transition
    wrapper.style.height = currentHeight + 'px';
    
    // Force reflow
    wrapper.offsetHeight;
    
    // Add fade-out effect to content
    const content = wrapper.firstElementChild;
    content.style.transition = `opacity ${this.animationDuration * 0.6}ms ease-in-out`;
    content.style.opacity = '0';
    
    // Animate to 0
    wrapper.style.height = '0px';
    
    // Remove open attribute after animation
    setTimeout(() => {
      details.removeAttribute('open');
      content.style.opacity = '1';
      callback();
    }, this.animationDuration);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AccordionAnimation();
  });
} else {
  new AccordionAnimation();
}

// Reinitialize for dynamically added content (e.g., quick view modals)
document.addEventListener('shopify:section:load', () => {
  new AccordionAnimation();
});