# Image Cache Module

Handles downloading and caching profile images to disk with automatic file management.

## Quick Start

```javascript
import { imageCache } from './index.js';

// Cache an image from URL
const filePath = await imageCache.cache('person-123', 'https://example.com/photo.jpg');

// Retrieve cached image path
const cachedPath = imageCache.retrieve('person-123');
```

## API

### `cache(id, imageUrl)`
Download and cache an image from URL to disk.
- **id** `string` - Person ID (used as filename)
- **imageUrl** `string` - URL of image to download
- **returns** `Promise<string|null>` - Path to cached image or null on error

```javascript
await imageCache.cache('person-456', 'https://api.example.com/photos/456.jpg');
// Creates: profiles/person-456.jpg (or .png, .gif, .webp based on content-type)
```

### `retrieve(id)`
Get the cached image path for a person.
- **id** `string` - Person ID
- **returns** `string|null` - File path if cached, null otherwise

```javascript
const path = imageCache.retrieve('person-456');
// Returns: /full/path/to/profiles/person-456.jpg
```

### `delete(id)`
Remove a cached image.
- **id** `string` - Person ID
- **returns** `boolean` - True if deleted, false otherwise

### `listCached()`
Get all cached image IDs.
- **returns** `string[]` - Array of person IDs with cached images

### `clearAll()`
Delete all cached images.

## Cache Location

Images are stored in the `profiles/` directory in the project root. The directory is created automatically.

## File Naming

Images are named using the person ID with appropriate extensions:
- `person-123.jpg` (default for unknown types)
- `person-456.png`
- `person-789.webp`

Extensions are detected from HTTP Content-Type headers.

## Integration Example

```javascript
import { imageCache } from './apis/imageCache/index.js';
import { planningCenter as pc } from './apis/planning_center/index.js';

const SERVICE_TYPE_ID = 6644;
const nextPlan = await pc.getNextPlan(SERVICE_TYPE_ID);
const team = await pc.getScheduledTeam(SERVICE_TYPE_ID, nextPlan.id);

// Cache all team member photos
for (const member of team) {
    if (member.photo_thumbnail_url) {
        await imageCache.cache(member.id, member.photo_thumbnail_url);
    }
}
```

## Error Handling

All methods gracefully handle errors and log warnings:
- Missing URLs return `null`
- Failed downloads return `null` and log error
- Missing cached files return `null` and log warning
