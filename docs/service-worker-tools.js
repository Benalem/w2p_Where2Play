export function swLog(state, str, error) {
    if (state.logLevel === 'debug') {
        console.debug(`SW: ${str}`, error ?? '');
    }
}
export class SwHelper {
    state;
    indexedDbHelper = new IndexedDbHelper();
    get State() {
        return this.state;
    }
    async database() {
        const database = await this.indexedDbHelper.openDb(this.stateDbName, 1, this.upgradeIndexedDb.bind(this));
        return database;
    }
    audienceExcludedPathPatterns = []; // list of regex pattern built from state.audienceExcludedPaths
    stateDbName = 'geogirafe-sw-state';
    stateStoreName = 'state';
    stateKey = 'config';
    initialized = false;
    async initialize(defaultState) {
        // If the state has already been initialized, do nothing
        if (!this.initialized) {
            this.state = defaultState;
            let savedState = null;
            try {
                savedState = await this.loadState();
            }
            catch (error) {
                this.log('No persisted state to load', error);
            }
            if (savedState) {
                this.state = {
                    ...defaultState,
                    ...savedState
                };
            }
            this.refreshAudienceExcludedPathPatterns();
            this.initialized = true;
        }
    }
    isOriginAllowed(eventOrigin, origin) {
        if (eventOrigin !== origin) {
            return false;
        }
        return true;
    }
    isLoggedIn() {
        return this.state.loginState === 'loggedIn' || this.state.loginState === 'issuer.loggedIn';
    }
    updateState(data) {
        if (data.logLevel) {
            this.state.logLevel = data.logLevel;
            this.log(`LogLevel changed: ${this.state.logLevel}`);
        }
        if (data.tilesStoreName) {
            this.state.tilesStoreName = data.tilesStoreName;
            this.log(`tilesStoreName changed: ${this.state.tilesStoreName}`);
        }
        if (data.storeVersion) {
            this.state.storeVersion = data.storeVersion;
            this.log(`storeVersion changed: ${this.state.storeVersion}`);
        }
        if (data.dbCacheName) {
            this.state.dbCacheName = data.dbCacheName;
            this.log(`dbCacheName changed: ${this.state.dbCacheName}`);
        }
        if (data.audience) {
            this.state.audience = data.audience ?? [];
            this.log(`audience changed: ${this.state.audience}`);
        }
        if (data.audienceExcludedPaths) {
            this.state.audienceExcludedPaths = data.audienceExcludedPaths;
            this.refreshAudienceExcludedPathPatterns();
            this.log(`audienceExcludedPaths changed: ${this.state.audienceExcludedPaths}`);
        }
        if (data.access_token) {
            this.state.accessToken = data.access_token;
            this.log(`access_token changed`);
        }
        if (data.clear_access_token) {
            this.state.accessToken = undefined;
            this.log('access_token cleared');
        }
        if (data.authMode) {
            this.state.authMode = data.authMode;
            this.log(`authMode changed: ${this.state.authMode}`);
        }
        if (data.alwaysSendCookies !== undefined) {
            this.state.alwaysSendCookies = data.alwaysSendCookies;
            this.log(`alwaysSendCookies changed: ${this.state.alwaysSendCookies}`);
        }
        if (data.refererPolicy) {
            this.state.refererPolicy = data.refererPolicy;
            this.log(`refererPolicy changed: ${this.state.refererPolicy}`);
        }
        if (data.loginState) {
            this.state.loginState = data.loginState;
            this.log(`loginState changed: ${this.state.loginState}`);
        }
    }
    getRequest(request) {
        if (request.mode === 'no-cors') {
            return request; // Cannot do anything here, the no-cors queries cannot be modified
        }
        try {
            const requestedUrl = new URL(request.url);
            const hostname = requestedUrl.hostname;
            // Prepare headers
            const headers = new Headers(request.headers);
            const shouldExclude = this.audienceExcludedPathPatterns.some((pattern) => pattern.test(requestedUrl.pathname));
            const rightAudience = this.state.audience?.includes(hostname) && !shouldExclude;
            if (rightAudience) {
                // Token
                const includeToken = this.state.authMode == 'token' && this.isLoggedIn() && this.state.accessToken;
                if (includeToken) {
                    headers.set('Authorization', `Bearer ${this.state.accessToken}`);
                }
                // Cookie
                const includeCookies = this.state.alwaysSendCookies || (this.isLoggedIn() && this.state.authMode === 'cookie');
                // Prepare new request with authentication data
                swLog(this.state, `including credentials for ${request.url} (rightAudience:${rightAudience}|includeCookies:${includeCookies}|includeToken:${includeToken})`);
                const fetchOptions = {
                    headers: headers,
                    credentials: includeCookies ? 'include' : 'same-origin',
                    referrer: request.referrer,
                    referrerPolicy: this.state.refererPolicy
                };
                return new Request(request, fetchOptions);
            }
            // If there is no need for authentication data (token or cookie)
            // We just return the original request
            return request;
        }
        catch (error) {
            // In case of error, we return the initial request
            this.log('Error while creating the request with authentication', error);
            return request;
        }
    }
    log(str, error) {
        swLog(this.state, str, error);
    }
    refreshAudienceExcludedPathPatterns() {
        this.audienceExcludedPathPatterns = this.state.audienceExcludedPaths.map((str) => new RegExp(str));
    }
    /**
     * Saves the service worker state
     */
    async saveState() {
        this.log('Save state');
        const db = await this.database();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.stateStoreName, 'readwrite');
            tx.objectStore(this.stateStoreName).put(this.state, this.stateKey);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    /**
     * Reloads the service worker state from indexDB
     */
    async loadState() {
        this.log('Reload state');
        const db = await this.database();
        const loadedState = await new Promise((resolve, reject) => {
            const tx = db.transaction(this.stateStoreName, 'readonly');
            const req = tx.objectStore(this.stateStoreName).get(this.stateKey);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        if (loadedState) {
            return loadedState;
        }
        return null;
    }
    upgradeIndexedDb(database) {
        database.createObjectStore(this.stateStoreName);
    }
}
export class IndexedDbHelper {
    timeout = 3000; // Timeout in case of not reachable IndexedDB. (3 sec.)
    databases = {};
    async openDb(name, version, upgradeFunction) {
        const key = `${name}:${version}`;
        let database = this.databases[key];
        if (!database) {
            database = await this.openDbInternal(name, version, upgradeFunction);
            this.databases[key] = database;
        }
        return database;
    }
    async openDbInternal(name, version, upgradeFunction) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, version);
            let timedOut = false;
            const timeoutId = setTimeout(() => {
                timedOut = true;
                reject(new Error('Timeout while opening IndexedDB'));
            }, this.timeout);
            request.onerror = (event) => {
                if (!timedOut) {
                    clearTimeout(timeoutId);
                    reject(event.target.error);
                }
            };
            request.onsuccess = (event) => {
                if (!timedOut) {
                    clearTimeout(timeoutId);
                    resolve(event.target.result);
                }
            };
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                const transaction = request.transaction;
                if (upgradeFunction) {
                    // Call upgrade function
                    upgradeFunction(database);
                    console.debug('IndexedDB upgraded.');
                }
                if (transaction) {
                    transaction.oncomplete = () => {
                        resolve(database);
                    };
                }
            };
        });
    }
    /**
     * Try to load this request from indexedDB.
     * Returns null if unsuccessful
     */
    async loadFromIndexedDB(state, request) {
        try {
            const database = await this.openDb(state.dbCacheName, state.storeVersion);
            const transaction = database.transaction([state.tilesStoreName], 'readonly');
            const store = transaction.objectStore(state.tilesStoreName);
            const index = store.index('url');
            return new Promise((resolve, reject) => {
                const dbRequest = index.get(request.url);
                dbRequest.onsuccess = () => {
                    if (dbRequest.result) {
                        const blob = dbRequest.result.data;
                        swLog(state, 'Tile found in cache.');
                        resolve(new Response(blob));
                    }
                    else {
                        swLog(state, 'Tile not found in cache.');
                        resolve(new Response(null, { status: 204 }));
                    }
                };
                dbRequest.onerror = () => {
                    reject(new Error('Error querying IndexedDB Store.'));
                };
            });
        }
        catch {
            return null;
        }
    }
}
export class CacheHelper {
    /**
     * To allow offline mode, the first 300 queries made by the application will be cached.
     * We could have implemented a more specific cache with file extensions for example
     * But then we should define exactly what should be cached.
     * This can be quite complex, because we cannot just cache all images,
     * as some of them are WMTS or WMS results and others are icons.
     * So a simple solution here is to cache all the first queries that are done
     * by the application when it starts. With this we should have all the necessary
     * cache to be able to start the application in offline mode
     *
     * The WMTS tiles and other results coming from OGC-Services will be cached on demand
     * with the OfflineManager component of the application.
     */
    appCacheName = 'pages'; // Name of the cache for application pages
    maxCacheCount = 300; // Number of queries that should be cached by the service-worker for offline usage.
    cacheCount = 0; // Counter related to the max value above
    /**
     * Execute a fetch for the query, and cache the result if successful
     * Returns null if unsuccessful
     */
    async fetchAndCache(state, request) {
        try {
            const response = await fetch(request);
            if (this.cacheCount < this.maxCacheCount &&
                this.isCacheAllowed(request) &&
                response.ok &&
                response.type !== 'opaque') {
                // Fetch was successful. We cache the result if necessary and return the response.
                this.cacheCount++;
                swLog(state, `${this.cacheCount}/${this.maxCacheCount} caching ${request.url} for offline use.`);
                const copy = response.clone();
                const cache = await caches.open(this.appCacheName);
                await cache.put(request, copy);
            }
            return response;
        }
        catch {
            return null;
        }
    }
    /**
     * Try to load this request from local cache.
     * Returns null if unsuccessful
     */
    async loadFromCache(request) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || null;
    }
    isCacheAllowed(request) {
        if (request.method !== 'GET') {
            return false;
        }
        if (request.headers.get('Range')) {
            // RANGE Request (for COG, FlatGeoBuf or GeoParquet for example)
            return false;
        }
        return true;
    }
}
