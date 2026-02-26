/**
 * Vite Plugin: Local Slides
 * Serves slideshow images from a local folder on disk
 * Also provides /api/slides endpoint to list available images
 */
import fs from 'fs';
import path from 'path';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

export default function localSlides(slidesFolder) {
    const resolvedFolder = path.resolve(slidesFolder);

    return {
        name: 'local-slides',
        configureServer(server) {
            // API: List available slide images
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url, 'http://localhost');

                if (url.pathname === '/api/slides') {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');

                    try {
                        if (!fs.existsSync(resolvedFolder)) {
                            console.log(`📸 [Slides] Folder not found: ${resolvedFolder}`);
                            res.writeHead(200);
                            res.end(JSON.stringify({ images: [], folder: resolvedFolder, error: 'Folder not found' }));
                            return;
                        }

                        const files = fs.readdirSync(resolvedFolder)
                            .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
                            .sort();

                        console.log(`📸 [Slides] Found ${files.length} images in ${resolvedFolder}`);

                        res.writeHead(200);
                        res.end(JSON.stringify({
                            images: files.map(f => `/local-slides/${f}`),
                            folder: resolvedFolder,
                            count: files.length,
                        }));
                    } catch (err) {
                        console.error('📸 [Slides] Error:', err.message);
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: err.message }));
                    }
                    return;
                }

                // Serve image files from the local folder
                if (req.url.startsWith('/local-slides/')) {
                    const filename = decodeURIComponent(req.url.replace('/local-slides/', ''));
                    const filePath = path.join(resolvedFolder, filename);

                    // Security: prevent path traversal
                    if (!filePath.startsWith(resolvedFolder)) {
                        res.writeHead(403);
                        res.end('Forbidden');
                        return;
                    }

                    if (!fs.existsSync(filePath)) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }

                    const ext = path.extname(filePath).toLowerCase();
                    const mimeTypes = {
                        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                        '.png': 'image/png', '.webp': 'image/webp',
                        '.gif': 'image/gif', '.bmp': 'image/bmp',
                        '.svg': 'image/svg+xml',
                    };

                    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
                    res.setHeader('Cache-Control', 'public, max-age=3600');
                    fs.createReadStream(filePath).pipe(res);
                    return;
                }

                next();
            });
        },
    };
}
