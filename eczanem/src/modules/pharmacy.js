/**
 * Pharmacy Map + Ticker Module
 * Shows pharmacies on a Leaflet map with a scrolling ticker bar at the bottom
 */
import { CONFIG } from '../config.js';
import { getLocation, calculateDistance, formatDistance } from './location.js';
import { fetchPharmacies } from './api.js';
// pharmacyStore is used via api.js

let map = null;
let refreshTimer = null;
let markersLayer = null;
let tileLayer = null;
let tileFailed = false;

/**
 * Initialize pharmacy mode
 */
export async function initPharmacy() {
  const retryBtn = document.getElementById('retry-btn');
  retryBtn.addEventListener('click', () => loadPharmacies());
  await loadPharmacies();
  startRefreshTimer();
}

/**
 * Load pharmacies and render map + ticker
 */
async function loadPharmacies() {
  const loading = document.getElementById('pharmacy-loading');
  const errorEl = document.getElementById('pharmacy-error');
  const locationInfo = document.getElementById('location-info');

  loading.style.display = 'flex';
  errorEl.style.display = 'none';

  try {
    // 1. Get location
    locationInfo.textContent = 'Konum belirleniyor...';
    const location = await getLocation();
    locationInfo.textContent = `📍 ${location.district}, ${location.city}`;

    // 2. Fetch pharmacies from scraper
    const pharmacies = await fetchPharmacies(location.city, location.district);
    console.log(`Got ${pharmacies.length} pharmacies for ${location.district}, ${location.city}`);

    // 3. Fill in missing coordinates (geocode from address)
    const withCoords = await ensureCoordinates(pharmacies, location);

    // 4. Calculate distances and sort
    const sorted = withCoords.map(p => ({
      ...p,
      distance: calculateDistance(location.lat, location.lng, p.lat, p.lng),
    })).sort((a, b) => a.distance - b.distance);

    // 5. Render
    loading.style.display = 'none';

    // If tiles previously failed, go straight to card view
    if (tileFailed) {
      renderCardView(sorted, location);
    } else {
      hideCardView();
      renderMap(location, sorted);
    }
    renderTicker(sorted);

    // Save current pharmacies to localStorage for QR page (nobetci.html)
    try {
      localStorage.setItem('currentPharmacies', JSON.stringify(sorted));
      localStorage.setItem('currentLocation', JSON.stringify(location));
    } catch { }
  } catch (error) {
    console.error('Load pharmacies error:', error);
    loading.style.display = 'none';
    showError(error.message || 'Nöbetçi eczaneler yüklenirken bir hata oluştu.');
  }
}

/**
 * Ensure all pharmacies have coordinates
 * Uses Nominatim geocoding for missing coords, with localStorage cache
 */
const GEO_CACHE_KEY = 'geocodeCache';

function getGeoCache() {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}');
  } catch { return {}; }
}

function setGeoCache(cache) {
  try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache)); } catch { }
}

async function geocodeAddress(name, address, city, district, centerLat, centerLng) {
  const cache = getGeoCache();
  const cacheKey = `${name}|${address}`;
  if (cache[cacheKey]) return cache[cacheKey];

  // Parse address components
  // e.g. "KAYALIK MAH. SAGLIK CAD. NO:44 /B"
  const mahMatch = address.match(/(\S+)\s+MAH\.?/i);
  const mah = mahMatch ? mahMatch[1].trim() : '';

  // Extract street with type (CAD/SOK etc) - full name
  const cadMatch = address.match(/([\wğüşıöçĞÜŞİÖÇ\s]+?)\s*(CAD|SOK|SOKAK|BULV|BULVAR)\.?/i);
  const cadName = cadMatch ? `${cadMatch[1].trim()} ${cadMatch[2]}` : '';

  // Extract building number
  const noMatch = address.match(/NO[:\s]*(\d+)/i);
  const no = noMatch ? `No ${noMatch[1]}` : '';

  // Viewbox: restrict to ~10km around center (use bounding box)
  const vbox = centerLat && centerLng
    ? `&viewbox=${centerLng - 0.1},${centerLat + 0.1},${centerLng + 0.1},${centerLat - 0.1}&bounded=1`
    : '';

  // Build queries from most specific to least
  const queries = [];
  // 1. Street + No + City (most specific)
  if (cadName && no) {
    queries.push(`q=${encodeURIComponent(`${cadName} ${no} ${city}`)}`);
  }
  // 2. Street + City
  if (cadName) {
    queries.push(`q=${encodeURIComponent(`${cadName} ${city}`)}`);
  }
  // 3. Mahalle + City  
  if (mah) {
    queries.push(`q=${encodeURIComponent(`${mah} Mahallesi ${city}`)}`);
  }

  for (const params of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&${params}${vbox}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'tr' }
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const result = { lat, lng };
        cache[cacheKey] = result;
        setGeoCache(cache);
        console.log(`Geocoded "${name}" → ${lat.toFixed(6)}, ${lng.toFixed(6)} (query: ${decodeURIComponent(params.substring(2))})`);
        return result;
      }
    } catch {
      continue;
    }
    await new Promise(r => setTimeout(r, 1100));
  }

  console.warn(`Could not geocode "${name}" (${address})`);
  return null;
}

async function ensureCoordinates(pharmacies, center) {
  const results = [];
  for (let i = 0; i < pharmacies.length; i++) {
    const p = pharmacies[i];
    if (p.lat && p.lng) {
      results.push(p);
      continue;
    }

    // Try geocoding
    const coords = await geocodeAddress(
      p.name,
      p.address || '',
      center.city || '',
      center.district || '',
      center.lat,
      center.lng
    );

    if (coords) {
      results.push({ ...p, lat: coords.lat, lng: coords.lng });
    } else {
      // Fallback: place near center with slight offset
      const angle = (2 * Math.PI * i) / pharmacies.length;
      const r = 0.003;
      results.push({
        ...p,
        lat: center.lat + r * Math.cos(angle),
        lng: center.lng + r * Math.sin(angle),
      });
    }
  }
  return results;
}

/**
 * Render Leaflet map
 */
let lastRenderedPharmacies = null;
let lastRenderedLocation = null;

function renderMap(userLocation, pharmacies) {
  lastRenderedPharmacies = pharmacies;
  lastRenderedLocation = userLocation;

  // Initialize map
  if (!map) {
    map = L.map('pharmacy-map', {
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap tiles with error detection
    let tileErrorCount = 0;
    let tileLoadCount = 0;
    tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 30,
      attribution: '',
    }).addTo(map);

    // Detect tile load failures → switch to card view
    tileLayer.on('tileerror', () => {
      tileErrorCount++;
      // If 4+ tiles fail and none loaded, assume offline
      if (tileErrorCount >= 4 && tileLoadCount === 0) {
        console.warn('Tile loading failed, switching to card view');
        tileFailed = true;
        renderCardView(
          lastRenderedPharmacies || pharmacies,
          lastRenderedLocation || userLocation
        );
      }
    });
    tileLayer.on('tileload', () => {
      tileLoadCount++;
    });
  }

  // Clear markers
  if (markersLayer) map.removeLayer(markersLayer);
  markersLayer = L.layerGroup().addTo(map);

  // User location marker
  L.marker([userLocation.lat, userLocation.lng], {
    icon: L.divIcon({
      className: 'user-marker-wrapper',
      html: '<div class="user-marker"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
  }).addTo(markersLayer);

  // Pharmacy markers
  const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);

  pharmacies.forEach((pharmacy, index) => {
    const icon = L.divIcon({
      className: 'pharmacy-marker-wrapper',
      html: '<div class="pharmacy-marker"><span class="pharmacy-marker-inner">+</span></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -42],
    });

    const distText = formatDistance(pharmacy.distance);

    const popup = `
      <div class="pharmacy-popup">
        <div class="popup-name">${escapeHtml(pharmacy.name)}</div>
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${escapeHtml(pharmacy.address)}</span>
        </div>
        ${pharmacy.phone ? `
        <div class="popup-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.78.3 1.54.52 2.29a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.22 1.51.4 2.29.52A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>${escapeHtml(pharmacy.phone)}</span>
        </div>` : ''}
        <div class="popup-footer">
          <span class="popup-dist">${distText}</span>
          <span class="popup-district-name">${escapeHtml(pharmacy.district)}</span>
        </div>
      </div>
    `;

    const marker = L.marker([pharmacy.lat, pharmacy.lng], { icon })
      .addTo(markersLayer)
      .bindPopup(popup, { maxWidth: 280, closeButton: true });

    // Open first (nearest) popup
    if (index === 0) {
      setTimeout(() => marker.openPopup(), 600);
    }

    bounds.extend([pharmacy.lat, pharmacy.lng]);
  });

  // Fit map
  if (pharmacies.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  } else {
    map.setView([userLocation.lat, userLocation.lng], 13);
  }

  // Force map to recalculate size after layout settles
  // Multiple calls needed because flex layout takes time
  const refreshMap = () => {
    map.invalidateSize();
    if (pharmacies.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };
  setTimeout(refreshMap, 100);
  setTimeout(refreshMap, 500);
  setTimeout(refreshMap, 1000);
}

/**
 * Render scrolling ticker bar
 */
function renderTicker(pharmacies) {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  if (pharmacies.length === 0) {
    track.innerHTML = '<div class="ticker-item"><span class="ticker-name" style="color:#94a3b8">Nöbetçi eczane bulunamadı</span></div>';
    return;
  }

  // Build items (duplicate for seamless loop)
  const items = pharmacies.map(p => {
    const dist = formatDistance(p.distance);
    const shortAddr = p.address && p.address.length > 60
      ? p.address.substring(0, 57) + '...'
      : (p.address || '');
    return `
      <div class="ticker-item">
        <div class="ticker-cross">+</div>
        <div class="ticker-info">
          <span class="ticker-name">${escapeHtml(p.name)}</span>
          ${shortAddr ? `<span class="ticker-address">${escapeHtml(shortAddr)}</span>` : ''}
          <span class="ticker-meta">
            <span class="ticker-distance">${dist}</span>
            <span class="ticker-phone">${escapeHtml(p.phone)}</span>
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Duplicate for seamless infinite scroll
  track.innerHTML = items + items;

  // Adjust animation speed based on number of items
  const duration = Math.max(15, pharmacies.length * 8);
  track.style.animationDuration = `${duration}s`;

  // Generate QR code linking to nobetci.html
  generateTickerQR();
}

function showError(message) {
  const errorEl = document.getElementById('pharmacy-error');
  const errorMsg = document.getElementById('error-message');
  errorMsg.textContent = message;
  errorEl.style.display = 'flex';
}

/**
 * Generate QR code pointing to nobetci.html
 */
let qrGenerated = false;
function generateTickerQR() {
  if (qrGenerated) return;
  const container = document.getElementById('ticker-qr-code');
  if (!container) return;

  const targetUrl = `${window.location.origin}/nobetci.html`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(targetUrl)}&bgcolor=0a0e17&color=e2e8f0&format=svg`;

  container.innerHTML = `<img src="${qrApiUrl}" alt="QR" width="90" height="90" style="border-radius:6px;display:block;" />`;
  qrGenerated = true;
}

function startRefreshTimer() {
  stopRefreshTimer();
  refreshTimer = setInterval(loadPharmacies, CONFIG.PHARMACY_REFRESH);
}

function stopRefreshTimer() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Render card view (for offline mode without coordinates)
 */
function renderCardView(pharmacies, location) {
  // Hide map, show card container
  const mapEl = document.getElementById('pharmacy-map');
  mapEl.style.display = 'none';

  let cardContainer = document.getElementById('pharmacy-cards');
  if (!cardContainer) {
    cardContainer = document.createElement('div');
    cardContainer.id = 'pharmacy-cards';
    cardContainer.className = 'pharmacy-cards';
    mapEl.parentElement.insertBefore(cardContainer, mapEl);
  }
  cardContainer.style.display = 'flex';

  if (pharmacies.length === 0) {
    cardContainer.innerHTML = `
      <div class="pharmacy-card-empty">
        <p>Bugün için nöbetçi eczane bulunamadı</p>
      </div>`;
    return;
  }

  const locText = location.district && location.city
    ? `${location.district}, ${location.city}`
    : '';

  cardContainer.innerHTML = `
    ${locText ? `<div class="cards-location-badge">📍 ${escapeHtml(locText)}</div>` : ''}
    <div class="cards-title">Bugün Nöbetçi Eczane${pharmacies.length > 1 ? 'ler' : ''}</div>
    <div class="cards-grid">
      ${pharmacies.map(p => `
        <div class="pharmacy-card">
          <div class="card-icon">
            <svg viewBox="0 0 40 40">
              <rect x="12" y="17" width="16" height="6" rx="1" fill="currentColor"/>
              <rect x="17" y="12" width="6" height="16" rx="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="card-content">
            <div class="card-name">${escapeHtml(p.name)}</div>
            <div class="card-address">${escapeHtml(p.address)}</div>
            ${p.phone ? `<div class="card-phone">${escapeHtml(p.phone)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Hide card view (when switching back to map mode)
 */
function hideCardView() {
  const cardContainer = document.getElementById('pharmacy-cards');
  if (cardContainer) cardContainer.style.display = 'none';
  const mapEl = document.getElementById('pharmacy-map');
  mapEl.style.display = '';
}

/**
 * Cleanup
 */
export function destroyPharmacy() {
  stopRefreshTimer();
  if (map) { map.remove(); map = null; }
  markersLayer = null;
  tileLayer = null;
  tileFailed = false;
  lastRenderedPharmacies = null;
  lastRenderedLocation = null;
  qrGenerated = false;
  hideCardView();
}
