/**
 * Main Application Entry
 * Handles mode switching and clock display
 */
import { CONFIG } from './config.js';
import { initSlideshow, destroySlideshow } from './modules/slideshow.js';
import { initPharmacy, destroyPharmacy } from './modules/pharmacy.js';
import { initAdmin } from './modules/admin.js';

let currentMode = null;
let modeCheckInterval = null;

/**
 * Application bootstrap
 */
function init() {
    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Init admin panel (settings button)
    initAdmin();

    // Determine initial mode and activate
    const mode = getCurrentMode();
    activateMode(mode);

    // Check mode periodically
    modeCheckInterval = setInterval(() => {
        const newMode = getCurrentMode();
        if (newMode !== currentMode) {
            switchMode(newMode);
        }
    }, CONFIG.MODE_CHECK_INTERVAL);
}

/**
 * Get current mode based on time
 */
function getCurrentMode() {
    const now = new Date();
    const hour = now.getHours();

    // Slideshow: 08:00 - 17:00
    if (hour >= CONFIG.SLIDESHOW_START && hour < CONFIG.SLIDESHOW_END) {
        return 'slideshow';
    }
    // All other hours: pharmacy mode (17:00 - 08:00)
    return 'pharmacy';
}

/**
 * Activate a mode (initial load)
 */
function activateMode(mode) {
    currentMode = mode;

    const slideshowContainer = document.getElementById('slideshow-container');
    const pharmacyContainer = document.getElementById('pharmacy-container');
    const modeBadge = document.getElementById('mode-badge');
    const modeText = modeBadge.querySelector('.mode-text');

    if (mode === 'slideshow') {
        slideshowContainer.classList.add('active');
        pharmacyContainer.classList.remove('active');
        modeBadge.classList.remove('pharmacy-mode');
        modeText.textContent = 'Vitrin Modu';
        initSlideshow();
    } else {
        pharmacyContainer.classList.add('active');
        slideshowContainer.classList.remove('active');
        modeBadge.classList.add('pharmacy-mode');
        modeText.textContent = 'Nöbetçi Eczane';
        initPharmacy();
    }
}

/**
 * Switch between modes with transition
 */
function switchMode(newMode) {
    const overlay = document.getElementById('transition-overlay');

    // Fade to black
    overlay.classList.add('active');

    setTimeout(() => {
        // Destroy current mode
        if (currentMode === 'slideshow') {
            destroySlideshow();
        } else {
            destroyPharmacy();
        }

        // Clear slideshow container if switching to pharmacy
        if (newMode === 'slideshow') {
            document.getElementById('slideshow-track').innerHTML = '';
            document.getElementById('slideshow-progress').innerHTML = '';
        }

        // Activate new mode
        activateMode(newMode);

        // Fade back in
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }, 500);
}

/**
 * Update clock display
 */
function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    clock.textContent = `${hours}:${minutes}`;
}

// Boot the app
document.addEventListener('DOMContentLoaded', init);
