/**
 * Pharmacy Map + Ticker Module
 * Shows pharmacies on a Leaflet map with a scrolling ticker bar at the bottom
 */
import { CONFIG } from '../config.js';
import { getLocation, calculateDistance, formatDistance } from './location.js';
import { fetchPharmacies } from './api.js';

let map = null;
let refreshTimer = null;
let markersLayer = null;

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

    // 3. Fill in missing coordinates
    const withCoords = ensureCoordinates(pharmacies, location);

    // 4. Calculate distances and sort
    const sorted = withCoords.map(p => ({
      ...p,
      distance: calculateDistance(location.lat, location.lng, p.lat, p.lng),
    })).sort((a, b) => a.distance - b.distance);

    // 5. Render
    loading.style.display = 'none';
    renderMap(location, sorted);
    renderTicker(sorted);
  } catch (error) {
    console.error('Load pharmacies error:', error);
    loading.style.display = 'none';
    showError(error.message || 'Nöbetçi eczaneler yüklenirken bir hata oluştu.');
  }
}

/**
 * Ensure all pharmacies have coordinates
 */
function ensureCoordinates(pharmacies, center) {
  return pharmacies.map((p, i) => {
    if (p.lat && p.lng) return p;
    // Distribute around center
    const angle = (2 * Math.PI * i) / pharmacies.length;
    const r = 0.005 + Math.random() * 0.008;
    return { ...p, lat: center.lat + r * Math.cos(angle), lng: center.lng + r * Math.sin(angle) };
  });
}

/**
 * Render Leaflet map
 */
function renderMap(userLocation, pharmacies) {
  // Initialize map
  if (!map) {
    map = L.map('pharmacy-map', {
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '',
    }).addTo(map);
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
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  } else {
    map.setView([userLocation.lat, userLocation.lng], 13);
  }

  // Force map to recalculate size after layout settles
  // Multiple calls needed because flex layout takes time
  const refreshMap = () => {
    map.invalidateSize();
    if (pharmacies.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
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
    return `
      <div class="ticker-item">
        <div class="ticker-cross">+</div>
        <div class="ticker-info">
          <span class="ticker-name">${escapeHtml(p.name)}</span>
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
  const duration = Math.max(15, pharmacies.length * 6);
  track.style.animationDuration = `${duration}s`;
}

function showError(message) {
  const errorEl = document.getElementById('pharmacy-error');
  const errorMsg = document.getElementById('error-message');
  errorMsg.textContent = message;
  errorEl.style.display = 'flex';
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
 * Cleanup
 */
export function destroyPharmacy() {
  stopRefreshTimer();
  if (map) { map.remove(); map = null; }
  markersLayer = null;
}
