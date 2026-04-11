// Simple image lightbox for portfolio

let currentImageIndex = 0;
let allImages = [];
let currentImageSet = [];

// Initialize lightbox
export function initLightbox() {
    // Click handlers for images
    document.addEventListener('click', handleImageClick);

    // Keyboard navigation
    document.addEventListener('keydown', handleLightboxKeydown);
}

// Handle image click
function handleImageClick(event) {
    const img = event.target.closest('.portfolio__content-img');
    if (!img) return;

    // Collect all images in the current view
    const visibleContainer = document.querySelector('.portfolio:not([hidden])') ||
        document.querySelector('[role="region"]:not([hidden])');
    if (!visibleContainer) return;

    allImages = Array.from(visibleContainer.querySelectorAll('.portfolio__content-img'));
    currentImageSet = allImages.filter(i => !i.closest('[hidden]'));

    if (currentImageSet.length === 0) return;

    currentImageIndex = currentImageSet.indexOf(img);
    if (currentImageIndex === -1) return;

    showLightbox(img.src, img.alt);
}

// Show lightbox modal
function showLightbox(src, alt) {
    let lightbox = document.getElementById('lightbox');

    if (!lightbox) {
        lightbox = createLightboxElement();
        document.body.appendChild(lightbox);
    }

    const img = lightbox.querySelector('.lightbox__img');
    const caption = lightbox.querySelector('.lightbox__caption');
    const counter = lightbox.querySelector('.lightbox__counter');

    img.src = src;
    img.alt = alt;
    caption.textContent = alt || '';

    // Update counter
    if (currentImageSet.length > 1) {
        counter.textContent = `${currentImageIndex + 1} / ${currentImageSet.length}`;
        counter.hidden = false;
    } else {
        counter.hidden = true;
    }

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.hidden = true;
    document.body.style.overflow = '';
}

// Navigate to previous image
function previousImage() {
    if (currentImageSet.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + currentImageSet.length) % currentImageSet.length;
    const img = currentImageSet[currentImageIndex];
    showLightbox(img.src, img.alt);
}

// Navigate to next image
function nextImage() {
    if (currentImageSet.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % currentImageSet.length;
    const img = currentImageSet[currentImageIndex];
    showLightbox(img.src, img.alt);
}

// Handle keyboard in lightbox
function handleLightboxKeydown(event) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.hidden) return;

    switch (event.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            previousImage();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextImage();
            break;
    }
}

// Create lightbox DOM element
function createLightboxElement() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Image viewer');
    lightbox.setAttribute('aria-modal', 'true');

    lightbox.innerHTML = `
    <div class="lightbox__overlay"></div>
    <div class="lightbox__container">
      <button class="lightbox__close" aria-label="Close image viewer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <img class="lightbox__img" src="" alt="" />
      <div class="lightbox__footer">
        <p class="lightbox__caption"></p>
        <div class="lightbox__counter"></div>
      </div>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button class="lightbox__nav lightbox__nav--next" aria-label="Next image">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  `;

    // Add event listeners
    lightbox.querySelector('.lightbox__overlay').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', previousImage);
    lightbox.querySelector('.lightbox__nav--next').addEventListener('click', nextImage);

    return lightbox;
}
