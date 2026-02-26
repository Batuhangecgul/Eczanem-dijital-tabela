/**
 * Image Store Module
 * Stores slideshow images in IndexedDB for persistence
 * Works entirely in the browser — no backend needed
 */

const DB_NAME = 'eczanem-slides';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db = null;

/**
 * Open/initialize IndexedDB
 */
function openDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onerror = (e) => {
            reject(new Error('IndexedDB error: ' + e.target.error));
        };
    });
}

/**
 * Save images to IndexedDB
 * @param {File[]} files - Array of File objects from file input
 */
export async function saveImages(files) {
    const database = await openDB();

    // Clear existing images
    await clearImages();

    // Read ALL files into memory first (async part)
    const items = [];
    for (const file of files) {
        const data = await file.arrayBuffer();
        items.push({
            name: file.name,
            type: file.type,
            data,
            size: file.size,
            addedAt: Date.now(),
        });
    }

    // Write to IDB in one synchronous transaction
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    items.forEach(item => store.add(item));

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(items.length);
        tx.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Get all stored images as object URLs
 * @returns {Promise<{name: string, url: string}[]>}
 */
export async function getImages() {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const images = request.result.map(item => ({
                name: item.name,
                url: URL.createObjectURL(new Blob([item.data], { type: item.type })),
            }));
            resolve(images);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Get image count
 */
export async function getImageCount() {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

/**
 * Clear all stored images
 */
export async function clearImages() {
    const database = await openDB();
    const tx = database.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}
