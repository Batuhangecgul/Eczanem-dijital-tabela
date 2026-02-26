/**
 * Vite Plugin: Pharmacy Scraper
 * Scrapes eczaneler.gen.tr for on-duty pharmacies with REAL coordinates
 * Uses the ?harita=1 page which contains Yandex Maps Placemarks with exact lat/lng
 * No separate server needed — just run `npm run dev`
 */
import * as cheerio from 'cheerio';

// Cache scraped data for the day
let cache = { date: null, city: null, data: null };

export default function pharmacyScraper() {
    return {
        name: 'pharmacy-scraper',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = new URL(req.url, 'http://localhost');
                if (url.pathname !== '/api/pharmacies') return next();

                const city = url.searchParams.get('city') || 'Tokat';
                const district = url.searchParams.get('district') || '';

                console.log(`\n🏥 [Scraper] city=${city}, district=${district}`);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');

                try {
                    const pharmacies = await scrapePharmacies(city, district);

                    // Filter by district if specified
                    let result = pharmacies;
                    if (district) {
                        const distSlug = slugify(district);
                        const filtered = pharmacies.filter(p => slugify(p.district) === distSlug);
                        if (filtered.length > 0) result = filtered;
                    }

                    res.writeHead(200);
                    res.end(JSON.stringify({
                        status: 'success',
                        count: result.length,
                        city, district,
                        pharmacies: result,
                    }));
                } catch (error) {
                    console.error('🏥 [Scraper] Error:', error.message);
                    res.writeHead(500);
                    res.end(JSON.stringify({ status: 'error', message: error.message }));
                }
            });
        },
    };
}

/**
 * Scrape on-duty pharmacies from eczaneler.gen.tr
 * Uses the MAP page (?harita=1) which has exact coordinates
 */
async function scrapePharmacies(city) {
    const today = new Date().toISOString().split('T')[0];

    if (cache.date === today && cache.city === city && cache.data) {
        console.log('   ✓ Cache hit');
        return cache.data;
    }

    const citySlug = slugify(city);
    const url = `https://www.eczaneler.gen.tr/nobetci-${citySlug}?harita=1`;
    console.log(`   Fetching: ${url}`);

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

    // Extract coordinates + info from ymaps.Placemark JavaScript calls
    // Format: ymaps.Placemark([LAT,LNG], {hintContent: 'NAME', balloonContent: '...<b>Adresi: </b>ADDRESS<br><b>Telefon: </b>PHONE...'})
    const placemarkRegex = /ymaps\.Placemark\(\[([0-9.]+),([0-9.]+)\],\s*\{hintContent:\s*'([^']*)',\s*balloonContent:\s*'([^']*)'/g;

    let match;
    while ((match = placemarkRegex.exec(html)) !== null) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        const name = match[3];
        const balloon = match[4];

        // Parse address from balloon HTML
        const addressMatch = balloon.match(/Adresi:\s*<\/b>([^<]*)/);
        const phoneMatch = balloon.match(/Telefon:\s*<\/b>([^<]*)/);

        const address = addressMatch ? addressMatch[1].trim() : '';
        const phone = phoneMatch ? formatPhone(phoneMatch[1].trim()) : '';

        // Extract district from address (format: "... District / City")
        let district = '';
        const districtMatch = address.match(/([^\s/]+)\s*\/\s*[^\s/]+$/);
        if (districtMatch) {
            district = districtMatch[1].trim();
        }

        pharmacies.push({
            name,
            address,
            district,
            phone,
            city,
            lat,
            lng,
        });

        console.log(`   ✓ ${name} [${lat}, ${lng}] — ${district}`);
    }

    console.log(`   Found ${pharmacies.length} pharmacies with real coordinates`);

    cache = { date: today, city, data: pharmacies };
    return pharmacies;
}

/**
 * Format phone number nicely
 */
function formatPhone(raw) {
    // Input like "03564612255" → "0 (356) 461-22-55"
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
