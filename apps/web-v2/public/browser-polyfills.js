// Browser polyfills for Edge compatibility

// Polyfill for CSS.supports if not available
if (!window.CSS || !window.CSS.supports) {
  window.CSS = window.CSS || {};
  window.CSS.supports = function() {
    return false;
  };
}

// Object-fit polyfill for IE/Edge
(function() {
  if ('objectFit' in document.documentElement.style === false) {
    document.addEventListener('DOMContentLoaded', function() {
      Array.prototype.forEach.call(document.querySelectorAll('img[data-object-fit]'), function(image) {
        var container = image.parentNode;
        var objectFit = image.getAttribute('data-object-fit') || 'cover';
        
        if (container.style.position !== 'absolute') {
          container.style.position = 'relative';
        }
        
        image.style.position = 'absolute';
        image.style.top = '0';
        image.style.left = '0';
        image.style.width = '100%';
        image.style.height = '100%';
        
        if (objectFit === 'cover') {
          image.style.objectFit = 'cover';
          // Fallback for browsers that don't support object-fit
          image.style.fontFamily = 'object-fit: cover;';
        }
      });
    });
  }
})();

// Intersection Observer polyfill check
if (!('IntersectionObserver' in window)) {
  // Load intersection observer polyfill if needed
  console.warn('IntersectionObserver not supported, animations may not work properly');
}

// CSS Grid support check and fallback
if (!CSS.supports('display', 'grid')) {
  document.documentElement.classList.add('no-grid');
}

// Aspect ratio polyfill
if (!CSS.supports('aspect-ratio', '16/9')) {
  document.documentElement.classList.add('no-aspect-ratio');
  
  // Apply aspect ratio polyfill to elements
  document.addEventListener('DOMContentLoaded', function() {
    var aspectRatioElements = document.querySelectorAll('.aspect-video');
    aspectRatioElements.forEach(function(element) {
      element.style.position = 'relative';
      element.style.width = '100%';
      element.style.height = '0';
      element.style.paddingBottom = '56.25%'; // 16:9 ratio
      
      var children = element.children;
      for (var i = 0; i < children.length; i++) {
        children[i].style.position = 'absolute';
        children[i].style.top = '0';
        children[i].style.left = '0';
        children[i].style.width = '100%';
        children[i].style.height = '100%';
      }
    });
  });
}

// Fix for CSS custom properties in older browsers
if (!CSS.supports('color', 'var(--test)')) {
  document.documentElement.classList.add('no-css-vars');
}

// Flexbox gap polyfill
if (!CSS.supports('gap', '1rem')) {
  document.documentElement.classList.add('no-flex-gap');
  
  document.addEventListener('DOMContentLoaded', function() {
    // Add margins to flex children as fallback for gap
    var flexContainers = document.querySelectorAll('.flex[class*="gap-"]');
    flexContainers.forEach(function(container) {
      var children = Array.from(container.children);
      var gapClass = Array.from(container.classList).find(cls => cls.startsWith('gap-'));
      
      if (gapClass) {
        var gapValue;
        switch(gapClass) {
          case 'gap-1': gapValue = '0.25rem'; break;
          case 'gap-2': gapValue = '0.5rem'; break;
          case 'gap-4': gapValue = '1rem'; break;
          case 'gap-8': gapValue = '2rem'; break;
          default: gapValue = '0.5rem';
        }
        
        children.forEach(function(child, index) {
          if (index > 0) {
            if (container.classList.contains('flex-col')) {
              child.style.marginTop = gapValue;
            } else {
              child.style.marginLeft = gapValue;
            }
          }
        });
      }
    });
  });
}

// Browser detection for specific fixes
var isEdge = /Edge\/\d+/.test(navigator.userAgent);
var isIE = /Trident\/\d+/.test(navigator.userAgent);

if (isEdge || isIE) {
  document.documentElement.classList.add('is-edge-or-ie');
  
  // Apply additional Edge-specific fixes
  document.addEventListener('DOMContentLoaded', function() {
    // Fix for line-clamp issues
    var lineClampElements = document.querySelectorAll('.line-clamp-3');
    lineClampElements.forEach(function(element) {
      element.style.display = '-webkit-box';
      element.style.webkitLineClamp = '3';
      element.style.webkitBoxOrient = 'vertical';
      element.style.overflow = 'hidden';
      element.style.maxHeight = '4.5em';
      element.style.lineHeight = '1.5em';
    });
  });
}