/**
 * Slideshow Module
 * Fullscreen image slideshow with crossfade transitions
 * Images loaded from IndexedDB (uploaded via admin panel)
 */
import { CONFIG } from '../config.js';
import { getImages } from './imageStore.js';

let currentSlide = 0;
let slideTimer = null;
let slides = [];

/**
 * Initialize slideshow
 */
export async function initSlideshow() {
    const track = document.getElementById('slideshow-track');
    const progress = document.getElementById('slideshow-progress');
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');

    // Get images from IndexedDB
    let images = [];
    try {
        images = await getImages();
        console.log(`Slideshow: ${images.length} images from IndexedDB`);
    } catch (e) {
        console.warn('Could not load slides:', e);
    }

    if (images.length === 0) {
        showEmptyState(track);
        return;
    }

    // Create slide elements
    images.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = `slide${index === 0 ? ' active' : ''}`;
        slide.innerHTML = `<img src="${img.url}" alt="${img.name}" />`;
        track.appendChild(slide);
        slides.push(slide);
    });

    // Create progress dots (max 15 visible)
    if (images.length <= 15) {
        images.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `progress-dot${index === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => goToSlide(index));
            progress.appendChild(dot);
        });
    }

    // Navigation
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Touch support
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextSlide();
            else prevSlide();
        }
    }, { passive: true });

    // Keyboard support
    document.addEventListener('keydown', handleKeydown);

    // Start autoplay
    startAutoplay();
}

function handleKeydown(e) {
    if (document.getElementById('slideshow-container')?.classList.contains('active')) {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    }
}

function goToSlide(index) {
    if (index === currentSlide || slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    document.querySelectorAll('.progress-dot')[currentSlide]?.classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.progress-dot')[currentSlide]?.classList.add('active');
    resetAutoplay();
}

function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
}

function prevSlide() {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
}

function startAutoplay() {
    stopAutoplay();
    slideTimer = setInterval(nextSlide, CONFIG.SLIDE_INTERVAL);
}

function stopAutoplay() {
    if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
}

function resetAutoplay() { startAutoplay(); }

function showEmptyState(container) {
    container.innerHTML = `
    <div class="slideshow-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="m21 15-5-5L5 21"/>
      </svg>
      <h3>Görsel Yüklenmemiş</h3>
      <p>Sağ alttaki <strong>⚙</strong> butonuna tıklayıp vitrin görsellerinizi yükleyin.</p>
    </div>
  `;
}

export function destroySlideshow() {
    stopAutoplay();
    document.removeEventListener('keydown', handleKeydown);
    slides = [];
    currentSlide = 0;
}
