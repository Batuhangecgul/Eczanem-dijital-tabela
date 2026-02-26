/**
 * Admin Panel Module
 * Provides a settings button to upload slideshow images
 * Images are stored in IndexedDB — no backend required
 */
import { saveImages, getImageCount, clearImages } from './imageStore.js';

let panelOpen = false;

/**
 * Initialize admin panel
 */
export function initAdmin() {
    createAdminButton();
    createAdminPanel();
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
        <h2>📸 Vitrin Görselleri</h2>
        <button class="admin-close" id="admin-close">&times;</button>
      </div>

      <div class="admin-body">
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
        }
    });

    // Show initial status
    updateStatus();
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
        status.innerHTML = `<div class="status-success">✅ ${count} görsel kaydedildi! Sayfayı yenileyin.</div>`;
        updateStatus();
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

function togglePanel() {
    const panel = document.getElementById('admin-panel');
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
}
