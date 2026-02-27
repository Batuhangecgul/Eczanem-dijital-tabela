/**
 * API Module
 * Fetches on-duty pharmacy data from local scraper (Vite plugin)
 * Falls back to demo data if scraper fails
 */
import { CONFIG } from '../config.js';
import { getOfflinePharmacies, isOfflineMode } from './pharmacyStore.js';

// Cache
let cache = { date: null, data: null };

/**
 * Fetch on-duty pharmacies for a given city/district
 */
export async function fetchPharmacies(city, district) {
    const today = new Date().toISOString().split('T')[0];

    // Check offline mode first
    if (isOfflineMode()) {
        const offlineData = getOfflinePharmacies();
        console.log(`Using ${offlineData.length} offline pharmacies`);
        return offlineData;
    }

    if (cache.date === today && cache.data) {
        console.log('Using cached pharmacy data');
        return cache.data;
    }

    // Fetch from local scraper endpoint (Vite plugin)
    try {
        const params = new URLSearchParams({ city, district });
        const response = await fetch(`/api/pharmacies?${params}`);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (result.status === 'success' && result.pharmacies?.length > 0) {
            cache = { date: today, data: result.pharmacies };
            console.log(`Scraped ${result.pharmacies.length} pharmacies from eczaneler.gen.tr`);
            return result.pharmacies;
        }

        throw new Error('No pharmacies found');
    } catch (error) {
        console.warn('Scraper failed:', error.message);

        // Fallback: demo data
        console.warn('Using demo data');
        const demo = getDemoData(city, district);
        cache = { date: today, data: demo };
        return demo;
    }
}

/**
 * Demo fallback data with approximate coordinates
 */
function getDemoData(city, district) {
    return [
        {
            name: 'Hayat Eczanesi',
            address: 'Cumhuriyet Mah. Gazi Osman Paşa Blv. No:42',
            phone: '0356 212 34 56',
            city: city || 'Tokat',
            district: district || 'Merkez',
            lat: 40.3142, lng: 36.5535,
        },
        {
            name: 'Sağlık Eczanesi',
            address: 'Bahçelievler Mah. İstiklal Cad. No:18/A',
            phone: '0356 214 78 90',
            city: city || 'Tokat',
            district: district || 'Merkez',
            lat: 40.3168, lng: 36.5562,
        },
        {
            name: 'Güneş Eczanesi',
            address: 'Yeni Mah. Turhal Cad. No:7',
            phone: '0356 213 45 67',
            city: city || 'Tokat',
            district: district || 'Merkez',
            lat: 40.3195, lng: 36.5508,
        },
        {
            name: 'Anadolu Eczanesi',
            address: 'Kızılay Mah. 19 Mayıs Sok. No:31/B',
            phone: '0356 215 67 89',
            city: city || 'Tokat',
            district: district || 'Merkez',
            lat: 40.3120, lng: 36.5580,
        },
        {
            name: 'Merkez Eczanesi',
            address: 'Sulusokak Mah. Sivas Cad. No:15',
            phone: '0356 216 78 90',
            city: city || 'Tokat',
            district: district || 'Merkez',
            lat: 40.3185, lng: 36.5620,
        },
    ];
}
