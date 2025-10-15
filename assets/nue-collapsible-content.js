document.addEventListener('DOMContentLoaded', function() {
  // Function to handle line breaks for FRAGRANCE text
  function handleFragranceLineBreaks() {
    // Only apply on desktop (screens wider than 750px to match Shopify's breakpoint)
    const isDesktop = window.innerWidth >= 750;
    
    // Find all accordion titles
    const accordionTitles = document.querySelectorAll('.accordion__title.inline-richtext');
    
    accordionTitles.forEach(title => {
      const titleText = title.textContent.trim();
      
      // Check if this title contains "FRAGRANCE Ingredients"
      if (titleText.includes('FRAGRANCE Ingredients')) {
        if (isDesktop) {
          // Replace FRAGRANCE with FRAGRANCE<br> only if not already done
          if (!title.innerHTML.includes('FRAGRANCE<br>')) {
            title.innerHTML = title.innerHTML.replace(/FRAGRANCE(\s+)/g, 'FRAGRANCE<br>');
          }
        } else {
          // Remove the line break on mobile
          title.innerHTML = title.innerHTML.replace(/FRAGRANCE<br>/g, 'FRAGRANCE ');
        }
      }
    });
  }
  
  // Run on page load
  handleFragranceLineBreaks();
  
  // Run on window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleFragranceLineBreaks, 250);
  });
});