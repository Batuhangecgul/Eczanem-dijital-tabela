/**
 * Pharmacy Store Module
 * Stores offline pharmacy schedule + location in localStorage
 * 
 * Supported text format (each line):
 * <ECZANE ADI><ADRES . TELEFON><GÜN.AY.YIL>
 * 
 * Location is set separately via admin panel (city, district, lat, lng)
 */

const STORAGE_KEY = 'offlinePharmacyData';
const LOCATION_KEY = 'offlineLocation';

// ────────────────────────────────
// Text parser
// ────────────────────────────────

/**
 * Parse the custom text format into structured data
 * Each line: <NAME><ADDRESS . PHONE><DD.MM.YYYY>
 * @param {string} text - raw text content
 * @returns {Array} parsed pharmacy entries with dates
 */
export function parsePharmacyText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const entries = [];

    // Regex: <NAME><ADDRESS . PHONE><DD.MM.YYYY>
    const lineRegex = /^<([^>]+)><([^>]+)><(\d{2}\.\d{2}\.\d{4})>$/;

    for (const line of lines) {
        const match = line.match(lineRegex);
        if (!match) continue;

        const name = match[1].trim();
        const addressPhone = match[2].trim();
        const dateStr = match[3].trim();

        // Split address and phone by last " . " separator
        let address = addressPhone;
        let phone = '';
        const dotIdx = addressPhone.lastIndexOf(' . ');
        if (dotIdx !== -1) {
            address = addressPhone.substring(0, dotIdx).trim();
            phone = addressPhone.substring(dotIdx + 3).trim();
        }

        // Parse date DD.MM.YYYY
        const [day, month, year] = dateStr.split('.').map(Number);
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        entries.push({ name, address, phone, date: dateKey });
    }

    return entries;
}

/**
 * Import from text, validate and save
 * @param {string} text - raw text
 * @returns {{ totalCount: number, todayCount: number }}
 */
export function importFromText(text) {
    const entries = parsePharmacyText(text);

    if (entries.length === 0) {
        throw new Error('Hiç eczane verisi bulunamadı. Format: <İSİM><ADRES . TEL><GÜN.AY.YIL>');
    }

    saveAllPharmacies(entries);

    const today = getTodayKey();
    const todayEntries = entries.filter(e => e.date === today);

    return {
        totalCount: entries.length,
        todayCount: todayEntries.length,
    };
}

// ────────────────────────────────
// Storage: All pharmacies (with dates)
// ────────────────────────────────

function saveAllPharmacies(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getAllPharmacies() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// ────────────────────────────────
// Storage: Location (separate)
// ────────────────────────────────

/**
 * Save location info
 * @param {{ city: string, district: string, lat: number, lng: number }} loc
 */
export function saveOfflineLocation(loc) {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

/**
 * Get offline location
 * @returns {{ city: string, district: string, lat: number, lng: number }|null}
 */
export function getOfflineLocation() {
    try {
        const data = localStorage.getItem(LOCATION_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

// ────────────────────────────────
// Public getters
// ────────────────────────────────

/**
 * Get today's on-duty pharmacies
 * @returns {Array} pharmacies for today
 */
export function getOfflinePharmacies() {
    const all = getAllPharmacies();
    if (all.length === 0) return [];

    const today = getTodayKey();
    return all.filter(e => e.date === today);
}

/**
 * Get ALL stored pharmacies (all dates)
 * @returns {Array}
 */
export function getAllOfflinePharmacies() {
    return getAllPharmacies();
}

/**
 * Check if offline mode is enabled (has pharmacy data)
 */
export function isOfflineMode() {
    return getAllPharmacies().length > 0;
}

/**
 * Clear all offline pharmacy data
 */
export function clearOfflineData() {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Clear offline location
 */
export function clearOfflineLocation() {
    localStorage.removeItem(LOCATION_KEY);
}

// ────────────────────────────────
// Helpers
// ────────────────────────────────

function getTodayKey() {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();

    // Nöbet değişim saati: 08:30
    // Saat 08:30'dan önce → dünün nöbetçisi
    if (hour < 8 || (hour === 8 && min < 30)) {
        // Dünün tarihini al
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
