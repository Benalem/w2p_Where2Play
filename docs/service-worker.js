// SPDX-License-Identifier: Apache-2.0
// NOTE REG: Here the extension ".js" MUST be present in the import,
// otherwise the service-worker won't be able to find the transpiled file
import { SwHelper, IndexedDbHelper, swLog, CacheHelper } from './service-worker-tools.js';
/**
 * The service worker state needs to be persisted
 * because when not using the app, the service worker can be paused by the browser
 * and in this case it will be reinitialized with the next query
 * with a base default empty state.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope
 */
const sw = globalThis;
const indexDbHelper = new IndexedDbHelper();
const cacheHelper = new CacheHelper();
// Initialize with default state
const swHelper = new SwHelper();
const swHelperReady = swHelper.initialize({
    storeVersion: 1,
    dbCacheName: 'geogirafe-cache',
    tilesStoreName: 'tiles',
    logLevel: 'warning',
    audience: [],
    audienceExcludedPaths: [],
    accessToken: undefined,
    loginState: undefined,
    authMode: undefined,
    alwaysSendCookies: false,
    refererPolicy: undefined
});
sw.addEventListener('message', handleMessage);
sw.addEventListener('install', handleInstall);
sw.addEventListener('activate', handleActivate);
sw.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        return;
    }
    event.respondWith(handleFetchEvent(event));
});
function handleMessage(event) {
    if (!swHelper.isOriginAllowed(self.location.origin, event.origin)) {
        console.warn(`Message ignored: origin not allowed (${event.origin})`);
        return;
    }
    const data = event.data;
    event.waitUntil((async () => {
        await swHelperReady;
        swHelper.updateState(data);
        // Persist the service worker state before acknowledging the message.
        await swHelper.saveState();
        if (data.messageId) {
            const source = event.source;
            if (source) {
                source.postMessage({ messageId: data.messageId, status: 'ServiceWorker updated' });
            }
        }
    })());
}
function handleInstall() {
    sw.skipWaiting();
    log('Service worker installed');
}
function handleActivate(event) {
    event.waitUntil((async () => {
        if ('clients' in sw) {
            await swHelperReady;
            await sw.clients.claim();
            const clientsList = await sw.clients.matchAll({ type: 'window' });
            for (const client of clientsList) {
                client.navigate(client.url);
                log('Page reloaded by the service worker.');
            }
        }
    })());
}
async function handleFetchEvent(event) {
    await swHelperReady;
    const newRequest = swHelper.getRequest(event.request);
    let response = await cacheHelper.fetchAndCache(swHelper.State, newRequest);
    // Use cache only for GET queries
    if (cacheHelper.isCacheAllowed(event.request)) {
        if (!response) {
            // Fetch was unsuccessful. We try to load the data from cache.
            response = await cacheHelper.loadFromCache(event.request);
        }
        if (!response) {
            // Not found in cache. We try to load from IndexedDB.
            response = await indexDbHelper.loadFromIndexedDB(swHelper.State, event.request);
        }
    }
    return response ?? new Response(null, { status: 503 });
}
function log(str, error) {
    swLog(swHelper.State, str, error);
}
