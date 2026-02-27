/**
 * Application Configuration
 */
export const CONFIG = {
    // Mode schedule (24h format)
    SLIDESHOW_START: 0,   // 08:00
    SLIDESHOW_END: 0,    // 17:00
    PHARMACY_START: 0,    // TEST: devre dışı
    PHARMACY_END: 0,      // TEST: devre dışı

    // Slideshow
    SLIDE_INTERVAL: 6000,       // ms between slides
    SLIDE_TRANSITION: 1200,     // ms transition duration

    // Pharmacy
    PHARMACY_REFRESH: 30 * 60 * 1000,  // 30 min refresh
    MAX_PHARMACIES: 30,                  // max pharmacies to show on map

    // Scraper (Vite plugin handles this)
    SCRAPER_ENDPOINT: '/api/pharmacies',

    // Fallback: Static location (lat, lng, city, district)
    // Set these if Geolocation is not available
    STATIC_LOCATION: {
        enabled: false,
        lat: 40.394422,
        lng: 37.335002,
        city: 'Tokat',
        district: 'Merkez',
    },

    // Slide images are loaded dynamically from the local folder
    // Configure folder path in vite.config.js

    // Mode check interval
    MODE_CHECK_INTERVAL: 60 * 1000, // 1 minute
};
