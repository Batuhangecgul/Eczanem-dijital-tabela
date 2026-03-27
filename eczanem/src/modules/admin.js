/**
 * Admin Panel Module
 * Provides a settings button to upload slideshow images
 * Images are stored in IndexedDB — no backend required
 */
import { saveImages, getImageCount, clearImages } from './imageStore.js';
import {
    getOfflinePharmacies, getAllOfflinePharmacies, getOfflineLocation,
    importFromText, clearOfflineData, clearOfflineLocation,
    saveOfflineLocation, isOfflineMode
} from './pharmacyStore.js';

let panelOpen = false;

/**
 * Initialize admin panel
 */
export function initAdmin() {
    createAdminButton();
    createAdminPanel();
    loadPharmacyName();
}

/**
 * Create floating settings button
 */
function createAdminButton() {
    const btn = document.createElement('button');
    btn.id = 'admin-btn';
    btn.innerHTML = '⚙';
    btn.title = 'Vitrin Ayarları';
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);
}

/**
 * Create admin panel overlay
 */
function createAdminPanel() {
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.innerHTML = `
    <div class="admin-dialog">
      <div class="admin-header">
        <h2>⚙️ Ayarlar</h2>
        <button class="admin-close" id="admin-close">&times;</button>
      </div>

      <div class="admin-body">
        <div class="admin-section">
          <h3 class="admin-section-title">🏷️ Eczane Adı</h3>
          <div class="admin-name-row">
            <input type="text" id="pharmacy-name-input" class="admin-input" placeholder="Eczane adını yazın..." maxlength="40" />
            <button class="admin-action-btn primary" id="save-name-btn">Kaydet</button>
          </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">📸 Vitrin Görselleri</h3>
          <p class="admin-desc">Vitrin modunda gösterilecek fotoğrafları seçin. Fotoğraflar tarayıcıda saklanır — sunucuya yüklenmez.</p>

        <div class="admin-upload-area" id="upload-area">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p><strong>Fotoğrafları seçin</strong> veya sürükleyip bırakın</p>
          <p class="upload-hint">JPG, PNG, WebP, GIF desteklenir</p>
          <input type="file" id="file-input" multiple accept="image/*" />
        </div>

        <div class="admin-status" id="admin-status"></div>

        <div class="admin-actions">
          <button class="admin-action-btn danger" id="clear-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Tümünü Sil
          </button>
        </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">🏥 Nöbetçi Eczaneler (Offline)</h3>
          <p class="admin-desc">Nöbetçi eczane listesini bir .txt dosyası olarak yükleyin. Her satır: <code>&lt;İSİM&gt;&lt;ADRES . TEL&gt;&lt;GÜN.AY.YIL&gt;</code></p>

          <div class="admin-upload-area" id="pharmacy-upload-area">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <polyline points="9 15 12 12 15 15"/>
            </svg>
            <p><strong>TXT dosyası seçin</strong> veya sürükleyip bırakın</p>
            <p class="upload-hint">.txt formatında nöbetçi listesi</p>
            <input type="file" id="pharmacy-file-input" accept=".txt,text/plain" />
          </div>

          <div class="admin-example-toggle">
            <button class="admin-link-btn" id="show-example-btn">📋 Örnek formatı göster</button>
          </div>
          <pre class="admin-code-block" id="example-json" style="display:none">&lt;MEHMETOĞLU ECZ.&gt;&lt;KAYALIK MAH. SAGLIK CAD. NO:44 /B . 0356 461 37 38&gt;&lt;01.02.2026&gt;
&lt;SAĞLAM ECZ.&gt;&lt;KAYALIK MAH. SAĞLIK CAD. NO:18 . 0356 461 28 28&gt;&lt;02.02.2026&gt;
&lt;SELVİ ECZ.&gt;&lt;KAYALIK MAH. SAGLIK CAD. NO:24 . 0356 461 47 58&gt;&lt;03.02.2026&gt;</pre>

          <div id="pharmacy-file-status" class="admin-status"></div>
          <div id="pharmacy-list" class="pharmacy-list"></div>

          <div class="admin-actions">
            <button class="admin-action-btn danger" id="clear-pharmacies-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Eczane Listesini Sil
            </button>
          </div>
        </div>

        <div class="admin-section">
          <h3 class="admin-section-title">📍 Lokasyon Ayarları</h3>
          <p class="admin-desc">Harita ve konum bilgisi için şehir, ilçe ve koordinatları girin.</p>
          <div class="pharmacy-form">
            <div class="form-row form-row-half">
              <input type="text" id="loc-city" class="admin-input" placeholder="Şehir (ör: Tokat)" />
              <input type="text" id="loc-district" class="admin-input" placeholder="İlçe (ör: Niksar)" />
            </div>
            <div class="form-row form-row-half">
              <input type="number" id="loc-lat" class="admin-input" placeholder="Enlem (lat)" step="any" />
              <input type="number" id="loc-lng" class="admin-input" placeholder="Boylam (lng)" step="any" />
            </div>
                        <div class="location-actions">
                            <button class="admin-action-btn primary" id="save-location-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Lokasyonu Kaydet
            </button>
                            <button class="admin-action-btn danger" id="clear-location-btn" title="Kayıtlı lokasyonu sil">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Lokasyonu Sil
                            </button>
                        </div>
          </div>
          <div id="location-status" class="admin-status"></div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(panel);

    // Event listeners
    document.getElementById('admin-close').addEventListener('click', togglePanel);
    panel.addEventListener('click', (e) => {
        if (e.target === panel) togglePanel();
    });

    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('upload-area');

    // File select
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) processFiles(files);
    });

    // Clear button
    document.getElementById('clear-btn').addEventListener('click', async () => {
        if (confirm('Tüm vitrin görselleri silinecek. Emin misiniz?')) {
            await clearImages();
            updateStatus();
            markDirty();
        }
    });

    // Pharmacy name input
    const nameInput = document.getElementById('pharmacy-name-input');
    const savedName = localStorage.getItem('pharmacyName') || '';
    nameInput.value = savedName;

    document.getElementById('save-name-btn').addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            localStorage.setItem('pharmacyName', name);
            applyPharmacyName(name);
            markDirty();
        }
    });

    // Offline pharmacy file upload
    const pharmacyFileInput = document.getElementById('pharmacy-file-input');
    const pharmacyUploadArea = document.getElementById('pharmacy-upload-area');

    pharmacyUploadArea.addEventListener('click', () => pharmacyFileInput.click());
    pharmacyFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handlePharmacyFile(file);
    });

    pharmacyUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        pharmacyUploadArea.classList.add('dragover');
    });
    pharmacyUploadArea.addEventListener('dragleave', () => {
        pharmacyUploadArea.classList.remove('dragover');
    });
    pharmacyUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        pharmacyUploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.txt') || file.type === 'text/plain')) {
            handlePharmacyFile(file);
        }
    });

    // Example toggle
    document.getElementById('show-example-btn').addEventListener('click', () => {
        const block = document.getElementById('example-json');
        block.style.display = block.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('clear-pharmacies-btn').addEventListener('click', () => {
        if (confirm('Eczane listesi silinecek. Emin misiniz?')) {
            clearOfflineData();
            renderPharmacyList();
            updatePharmacyFileStatus();
            markDirty();
        }
    });

    // Location settings
    const savedLoc = getOfflineLocation();
    if (savedLoc) {
        document.getElementById('loc-city').value = savedLoc.city || '';
        document.getElementById('loc-district').value = savedLoc.district || '';
        document.getElementById('loc-lat').value = savedLoc.lat || '';
        document.getElementById('loc-lng').value = savedLoc.lng || '';
    }

    document.getElementById('save-location-btn').addEventListener('click', () => {
        const city = document.getElementById('loc-city').value.trim();
        const district = document.getElementById('loc-district').value.trim();
        const lat = parseFloat(document.getElementById('loc-lat').value) || 0;
        const lng = parseFloat(document.getElementById('loc-lng').value) || 0;

        if (!city || !district) {
            alert('Şehir ve ilçe zorunludur.');
            return;
        }

        saveOfflineLocation({ city, district, lat, lng });
        markDirty();
        const locStatus = document.getElementById('location-status');
        locStatus.innerHTML = `<div class="status-success">✅ Lokasyon kaydedildi: ${district}, ${city}</div>`;
        setTimeout(() => {
            locStatus.innerHTML = `<div class="status-info">📍 ${district}, ${city}${lat ? ` (${lat}, ${lng})` : ''}</div>`;
        }, 3000);
    });

    // Clear saved location
    const clearLocBtn = document.getElementById('clear-location-btn');
    if (clearLocBtn) {
        clearLocBtn.addEventListener('click', () => {
            if (!confirm('Kayıtlı lokasyon silinecek. Emin misiniz?')) return;
            clearOfflineLocation();
            // Clear inputs
            document.getElementById('loc-city').value = '';
            document.getElementById('loc-district').value = '';
            document.getElementById('loc-lat').value = '';
            document.getElementById('loc-lng').value = '';
            // Update status
            const locStatus = document.getElementById('location-status');
            if (locStatus) locStatus.innerHTML = `<div class="status-info" style="color:#94a3b8">Lokasyon kaldırıldı</div>`;
            updateLocationStatus();
            markDirty();
        });
    }

    // Show saved location status
    updateLocationStatus();

    // Show initial status
    updateStatus();
    renderPharmacyList();
    updatePharmacyFileStatus();
}

/**
 * Handle file input change
 */
function handleFileSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) processFiles(files);
}

/**
 * Process and save selected files
 */
async function processFiles(files) {
    const status = document.getElementById('admin-status');
    status.innerHTML = `<div class="status-saving">Kaydediliyor... (${files.length} görsel)</div>`;

    try {
        const count = await saveImages(files);
        status.innerHTML = `<div class="status-success">✅ ${count} görsel kaydedildi!</div>`;
        updateStatus();
        markDirty();
    } catch (err) {
        status.innerHTML = `<div class="status-error">❌ Hata: ${err.message}</div>`;
    }
}

/**
 * Update status display
 */
async function updateStatus() {
    const status = document.getElementById('admin-status');
    try {
        const count = await getImageCount();
        if (count > 0) {
            status.innerHTML = `<div class="status-info">📷 ${count} görsel kayıtlı</div>`;
        } else {
            status.innerHTML = `<div class="status-info" style="color:#94a3b8">Henüz görsel yüklenmemiş</div>`;
        }
    } catch (e) {
        status.innerHTML = '';
    }
}

let adminDirty = false;

function togglePanel() {
    const panel = document.getElementById('admin-panel');
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);

    // If closing and changes were made, refresh the page
    if (!panelOpen && adminDirty) {
        adminDirty = false;
        window.location.reload();
    }
}

function markDirty() {
    adminDirty = true;
}

/**
 * Handle pharmacy TXT file upload
 */
function handlePharmacyFile(file) {
    const statusEl = document.getElementById('pharmacy-file-status');
    statusEl.innerHTML = '<div class="status-saving">Dosya okunuyor...</div>';

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = importFromText(e.target.result);
            statusEl.innerHTML = `<div class="status-success">✅ ${result.totalCount} kayıt yüklendi! Bugün ${result.todayCount} nöbetçi eczane var.</div>`;
            renderPharmacyList();
            markDirty();
        } catch (err) {
            statusEl.innerHTML = `<div class="status-error">❌ Hata: ${err.message}</div>`;
        }
    };
    reader.onerror = () => {
        statusEl.innerHTML = '<div class="status-error">❌ Dosya okunamadı</div>';
    };
    reader.readAsText(file);
}

/**
 * Update pharmacy file status indicator
 */
function updatePharmacyFileStatus() {
    const statusEl = document.getElementById('pharmacy-file-status');
    if (!statusEl) return;

    const all = getAllOfflinePharmacies();
    const today = getOfflinePharmacies();

    if (all.length > 0) {
        if (!statusEl.querySelector('.status-success') && !statusEl.querySelector('.status-error')) {
            statusEl.innerHTML = `<div class="status-info">🏥 ${all.length} toplam kayıt, bugün ${today.length} nöbetçi</div>`;
        }
    }
}

/**
 * Update location status
 */
function updateLocationStatus() {
    const locStatus = document.getElementById('location-status');
    if (!locStatus) return;

    const loc = getOfflineLocation();
    if (loc && loc.city) {
        locStatus.innerHTML = `<div class="status-info">📍 ${loc.district || ''}, ${loc.city}${loc.lat ? ` (${loc.lat}, ${loc.lng})` : ''}</div>`;
    } else {
        locStatus.innerHTML = `<div class="status-info" style="color:#94a3b8">Henüz lokasyon ayarlı değil</div>`;
    }
}

/**
 * Render offline pharmacy list (today's entries) in admin panel
 */
function renderPharmacyList() {
    const container = document.getElementById('pharmacy-list');
    const todayPharmacies = getOfflinePharmacies();
    const all = getAllOfflinePharmacies();

    if (all.length === 0) {
        container.innerHTML = '<div class="pharmacy-list-empty">Henüz nöbetçi listesi yüklenmemiş</div>';
        return;
    }

    if (todayPharmacies.length === 0) {
        container.innerHTML = `<div class="pharmacy-list-empty">Toplam ${all.length} kayıt var ama bugün için nöbetçi eczane bulunamadı</div>`;
        return;
    }

    const header = `<div class="pharmacy-list-header">📅 Bugünkü nöbetçi (${todayPharmacies.length})</div>`;

    const items = todayPharmacies.map(p => `
        <div class="pharmacy-list-item">
            <div class="pharmacy-list-info">
                <span class="pharmacy-list-name">${escapeHtmlStr(p.name)}</span>
                <span class="pharmacy-list-detail">${escapeHtmlStr(p.address || '')}${p.phone ? ' • ' + escapeHtmlStr(p.phone) : ''}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = header + items;
}

function escapeHtmlStr(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

/**
 * Load pharmacy name from localStorage
 */
function loadPharmacyName() {
    const name = localStorage.getItem('pharmacyName');
    if (name) {
        applyPharmacyName(name);
    }
}

/**
 * Apply pharmacy name to header
 */
function applyPharmacyName(name) {
    const el = document.getElementById('pharmacy-name');
    if (el) {
        el.textContent = name.toUpperCase();
    }
}
