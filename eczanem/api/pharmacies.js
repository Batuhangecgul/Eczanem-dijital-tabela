/**
 * Vercel Serverless Function: Pharmacy Scraper
 * Optimized source selection based on the active city.
 */

// Simple in-memory cache (persists per cold start)
let cache = { date: null, city: null, data: null };

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { city = 'Tokat', district = '' } = req.query;

    try {
        const pharmacies = await scrapePharmacies(city, district);

        res.status(200).json({
            status: 'success',
            count: pharmacies.length,
            city, district,
            pharmacies,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function scrapePharmacies(city, district = '') {
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.city === city && cache.data) {
        return cache.data;
    }

    const normalized = normalizeCity(city);
    const source = isIstanbulSourceCity(normalized) ? 'istanbul' : 'gen-tr';

    const pharmacies = source === 'istanbul'
        ? await scrapeIstanbulPharmacies(city, district)
        : await scrapeGenTrPharmacies(city, district);

    cache = { date: today, city, data: pharmacies };
    return pharmacies;
}

async function scrapeIstanbulPharmacies(city, district = '') {
    const pageUrl = 'https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/';
    const pageResponse = await fetch(pageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });

    if (!pageResponse.ok) throw new Error(`Istanbul source HTTP ${pageResponse.status}`);

    const html = await pageResponse.text();
    const tokenMatch = html.match(/(?:name|id)="h"[^>]*value="([^"]+)"/i);
    const h = tokenMatch ? tokenMatch[1] : '';

    if (!h) throw new Error('Istanbul source token not found');

    const form = new URLSearchParams({
        jx: '1',
        islem: 'get_eczane_markers',
        h,
    });

    const ajaxResponse = await fetch('https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/index.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: form.toString(),
    });

    if (!ajaxResponse.ok) throw new Error(`Istanbul AJAX HTTP ${ajaxResponse.status}`);

    const data = await ajaxResponse.json();
    const list = Array.isArray(data?.eczaneler) ? data.eczaneler : [];

    const pharmacies = list.map(item => ({
        name: cleanText(item.eczane_ad),
        address: buildAddress(item),
        district: cleanText(item.ilce || item.semt || ''),
        phone: formatPhone(cleanText(item.eczane_tel || '')),
        city: cleanText(item.il || city || 'İstanbul'),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng),
    })).filter(p => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (district) {
        const distSlug = slugify(district);
        return pharmacies.filter(p => slugify(p.district) === distSlug || slugify(city) === distSlug);
    }

    return pharmacies;
}

async function scrapeGenTrPharmacies(city, district = '') {
    const citySlug = slugify(city);
    const url = `https://www.eczaneler.gen.tr/nobetci-${citySlug}?harita=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'tr-TR,tr;q=0.9',
        },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const pharmacies = [];
    const placemarkRegex = /ymaps\.Placemark\(\[([0-9.]+),([0-9.]+)\],\s*\{hintContent:\s*'([^']*)',\s*balloonContent:\s*'([^']*)'/g;

    let match;
    while ((match = placemarkRegex.exec(html)) !== null) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        const name = match[3];
        const balloon = match[4];
        const addressMatch = balloon.match(/Adresi:\s*<\/b>([^<]*)/);
        const phoneMatch = balloon.match(/Telefon:\s*<\/b>([^<]*)/);

        const address = addressMatch ? addressMatch[1].trim() : '';
        const phone = phoneMatch ? formatPhone(phoneMatch[1].trim()) : '';

        let districtName = '';
        const districtMatch = address.match(/([^\s/]+)\s*\/\s*[^\s/]+$/);
        if (districtMatch) districtName = districtMatch[1].trim();

        pharmacies.push({
            name,
            address,
            district: districtName,
            phone,
            city,
            lat,
            lng,
        });
    }

    if (district) {
        const distSlug = slugify(district);
        return pharmacies.filter(p => slugify(p.district) === distSlug);
    }

    return pharmacies;
}

function buildAddress(item) {
    const parts = [item.mahalle, item.cadde_sokak, item.bina_kapi, item.semt || '', item.ilce || '']
        .filter(Boolean);
    return cleanText(parts.join(', '));
}

function cleanText(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function normalizeCity(value) {
    return normalizeTurkish(String(value || ''))
        .replace(/\s+/g, '')
        .trim();
}

function isIstanbulSourceCity(city) {
    return city.includes('istanbul') || city.includes('yalova');
}

function normalizeTurkish(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/İ/g, 'I')
        .replace(/ı/g, 'i')
        .toLowerCase();
}

function formatPhone(raw) {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
        return `0 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    }
    return raw;
}

function slugify(str) {
    return normalizeTurkish(String(str || ''))
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();
}
