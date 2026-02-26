/**
 * Vercel Serverless Function: Pharmacy Scraper
 * Scrapes eczaneler.gen.tr for on-duty pharmacies with real coordinates
 * Deploy: works automatically on Vercel as /api/pharmacies
 */

// Simple in-memory cache (persists per cold start)
let cache = { date: null, city: null, data: null };

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { city = 'Tokat', district = '' } = req.query;

    try {
        const pharmacies = await scrapePharmacies(city);

        // Filter by district
        let result = pharmacies;
        if (district) {
            const distSlug = slugify(district);
            const filtered = pharmacies.filter(p => slugify(p.district) === distSlug);
            if (filtered.length > 0) result = filtered;
        }

        res.status(200).json({
            status: 'success',
            count: result.length,
            city, district,
            pharmacies: result,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function scrapePharmacies(city) {
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.city === city && cache.data) {
        return cache.data;
    }

    const citySlug = slugify(city);
    const url = `https://www.eczaneler.gen.tr/nobetci-${citySlug}?harita=1`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Accept': 'text/html',
            'Accept-Language': 'tr-TR,tr;q=0.9',
        },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const pharmacies = [];

    const regex = /ymaps\.Placemark\(\[([0-9.]+),([0-9.]+)\],\s*\{hintContent:\s*'([^']*)',\s*balloonContent:\s*'([^']*)'/g;

    let match;
    while ((match = regex.exec(html)) !== null) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        const name = match[3];
        const balloon = match[4];

        const addressMatch = balloon.match(/Adresi:\s*<\/b>([^<]*)/);
        const phoneMatch = balloon.match(/Telefon:\s*<\/b>([^<]*)/);

        const address = addressMatch ? addressMatch[1].trim() : '';
        const phone = phoneMatch ? formatPhone(phoneMatch[1].trim()) : '';

        let district = '';
        const districtMatch = address.match(/([^\s/]+)\s*\/\s*[^\s/]+$/);
        if (districtMatch) district = districtMatch[1].trim();

        pharmacies.push({ name, address, district, phone, city, lat, lng });
    }

    cache = { date: today, city, data: pharmacies };
    return pharmacies;
}

function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) {
        return `0 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
    }
    return raw;
}

function slugify(str) {
    return str.toLowerCase()
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/İ/g, 'i').replace(/\s+/g, '-').trim();
}
