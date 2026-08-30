import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILES_DIR = path.join(__dirname, '../../data/profiles');

/**
 * Image Caching module
 * Handles downloading and caching profile images to disk
 */
class ImageCache {
    constructor() {
        // Ensure profiles directory exists
        if (!fs.existsSync(PROFILES_DIR)) {
            fs.mkdirSync(PROFILES_DIR, { recursive: true });
        }
    }

    /**
     * Get the file extension from content-type header
     */
    getExtensionFromContentType(contentType) {
        if (!contentType) return '.jpg';
        if (contentType.includes('png')) return '.png';
        if (contentType.includes('gif')) return '.gif';
        if (contentType.includes('webp')) return '.webp';
        return '.jpg';
    }

    /**
     * Cache an image from a URL to disk
     * @param {string} imageUrl - URL of the image to download
     * @returns {Promise<string>} Path to the cached image
     */
    async cache(imageUrl) {
        try {
            if (!imageUrl) {
                console.warn('No image URL provided');
                return null;
            }

            // Extract person ID from URL: /person/ID/ or from initials: /initials/XX.png
            let id;
            
            // Try person ID pattern first: /person/ID/
            const personMatch = imageUrl.match(/\/person\/([^/]+)\//);
            if (personMatch && personMatch[1]) {
                id = personMatch[1];
            } else {
                // Fall back to initials pattern: /initials/XX.png
                const initialsMatch = imageUrl.match(/\/initials\/([^.]+)\./);
                if (initialsMatch && initialsMatch[1]) {
                    id = `initials-${initialsMatch[1]}`;
                } else {
                    console.warn(`Could not extract ID from URL: ${imageUrl}`);
                    return null;
                }
            }

            // Check if already cached
            if (this.retrieve(id)) {
                console.log(`Image for id ${id} already cached`);
                return this.retrieve(id);
            }

            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            const ext = this.getExtensionFromContentType(contentType);
            const filename = `${id}${ext}`;
            const filepath = path.join(PROFILES_DIR, filename);

            // Download and write image to disk
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filepath, Buffer.from(buffer));

            console.log(`✓ Cached image for id ${id}: ${filename}`);
            return filepath;
        } catch (err) {
            console.error(`Error caching image:`, err.message);
            return null;
        }
    }

    /**
     * Retrieve a cached image path
     * @param {string} id - Person ID
     * @returns {string|null} Path to cached image if exists, null otherwise
     */
    retrieve(id) {
        try {
            // Check for common image extensions
            const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            
            for (const ext of extensions) {
                const filename = `${id}${ext}`;
                const filepath = path.join(PROFILES_DIR, filename);
                
                if (fs.existsSync(filepath)) {
                    return filepath;
                }
            }

            console.warn(`No cached image found for id: ${id}`);
            return null;
        } catch (err) {
            console.error(`Error retrieving image for id ${id}:`, err.message);
            return null;
        }
    }

    /**
     * Clear a cached image
     * @param {string} id - Person ID
     * @returns {boolean} True if deleted, false otherwise
     */
    delete(id) {
        try {
            const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            
            for (const ext of extensions) {
                const filename = `${id}${ext}`;
                const filepath = path.join(PROFILES_DIR, filename);
                
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    console.log(`✓ Deleted cached image for id ${id}`);
                    return true;
                }
            }

            return false;
        } catch (err) {
            console.error(`Error deleting image for id ${id}:`, err.message);
            return false;
        }
    }

    /**
     * Get all cached image IDs
     * @returns {string[]} Array of person IDs that have cached images
     */
    listCached() {
        try {
            const files = fs.readdirSync(PROFILES_DIR);
            return files.map(f => path.parse(f).name);
        } catch (err) {
            console.error('Error listing cached images:', err.message);
            return [];
        }
    }

    /**
     * Clear all cached images
     */
    clearAll() {
        try {
            const files = fs.readdirSync(PROFILES_DIR);
            files.forEach(f => {
                fs.unlinkSync(path.join(PROFILES_DIR, f));
            });
            console.log(`✓ Cleared ${files.length} cached images`);
        } catch (err) {
            console.error('Error clearing cache:', err.message);
        }
    }
}

export const imageCache = new ImageCache();
