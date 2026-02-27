/**
 * Location Module
 * Handles geolocation and reverse geocoding
 */
import { CONFIG } from '../config.js';
import { getOfflineLocation } from './pharmacyStore.js';

/**
 * Get device location using Geolocation API
 * Falls back to offline data, then static config
 */
export async function getLocation() {
    // Check offline location first
    const offlineLocation = getOfflineLocation();
    if (offlineLocation && (offlineLocation.city || offlineLocation.district)) {
        return {
            lat: offlineLocation.lat || 0,
            lng: offlineLocation.lng || 0,
            city: offlineLocation.city || '',
            district: offlineLocation.district || '',
        };
    }

    // Use static location if configured
    if (CONFIG.STATIC_LOCATION.enabled) {
        return {
            lat: CONFIG.STATIC_LOCATION.lat,
            lng: CONFIG.STATIC_LOCATION.lng,
            city: CONFIG.STATIC_LOCATION.city,
            district: CONFIG.STATIC_LOCATION.district,
        };
    }

    // Try browser Geolocation
    if (!navigator.geolocation) {
        throw new Error('Geolocation desteklenmiyor');
    }

    const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 min cache
        });
    });

    const { latitude: lat, longitude: lng } = position.coords;

    // Reverse geocode to get city/district
    const { city, district } = await reverseGeocode(lat, lng);

    return { lat, lng, city, district };
}

/**
 * Reverse geocode coordinates to city/district
 * Uses Nominatim (OSM) - free, no API key needed
 */
async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=tr&zoom=10`,
            {
                headers: {
                    'User-Agent': 'EczanemApp/1.0',
                },
            }
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const address = data.address || {};

        // Turkish city/district mapping
        const city = address.province || address.state || address.city || '';
        const district = address.county || address.town || address.suburb || address.city_district || '';

        return { city, district };
    } catch (error) {
        console.warn('Reverse geocoding failed:', error);
        return { city: '', district: '' };
    }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}
