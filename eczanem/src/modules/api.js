/**
 * API Module
 * Fetches on-duty pharmacy data from the local scraper.
 * No demo fallback: if scraping fails, the error is surfaced.
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
        throw error;
    }
}
