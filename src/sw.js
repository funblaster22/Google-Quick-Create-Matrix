// extension-specific configuration b/c I can't declare 2 in both manifest and in page
const getAccountScript = "get-account-script";

chrome.permissions.onAdded.addListener(permission => {
  console.log("permission added", permission);
  chrome.scripting
    .registerContentScripts([{
      id: getAccountScript,
      js: ["get-accounts.js"],
      persistAcrossSessions: false,
      matches: ["https://accounts.google.com/o/oauth2/*"],
    }])
});

chrome.permissions.onRemoved.addListener(permission => {
  console.log("permission removed", permission);
  chrome.scripting.unregisterContentScripts({ ids: [getAccountScript] })
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "/onboarding/1.html" }); // Replace with your desired page
  }
});

// Adapted from https://gist.github.com/fibo/4a1df242b900d4caa217dfc305266847

// Fill here with your cache name-version.
const CACHE_NAME = 'offline-cache-v1';
// This is the list of URLs to be cached by your Progressive Web App.
const CACHED_URLS = [];

// Open cache on install.
self.addEventListener('install', event => {
  event.waitUntil(async function () {
    const cache = await caches.open(CACHE_NAME)

    await cache.addAll(CACHED_URLS);
    self.skipWaiting();
  }());
});

addEventListener('message', async (event) => {
  // TODO: wrap in event.waitUntil if needed
  if (event.data.type === 'SAVE') {
    const cache = await caches.open(CACHE_NAME);
    const headers = {
      headers: {
        'Content-Type': 'text/html'
      }
    };
    // Must convert from chrome-extension protocol to https because "Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported"
    await cache.put(event.data.url.replace('chrome-extension', 'https'), new Response(event.data.body, headers));
    console.log("Successfully cached", event.data.url);
  } else if (event.data.type === 'DELETE') {
    await (await caches.open(CACHE_NAME)).delete(event.data.url.replace('chrome-extension', 'https'));
    console.log("Hello")
  }
});

// Cache and update with stale-while-revalidate policy.
self.addEventListener('fetch', event => {
  const { request } = event;

  // Prevent Chrome Developer Tools error:
  // Failed to execute 'fetch' on 'ServiceWorkerGlobalScope': 'only-if-cached' can be set only with 'same-origin' mode
  //
  // See also https://stackoverflow.com/a/49719964/1217468
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    console.log("Resource skipped");
    return;
  }

  event.respondWith(async function () {
    const cache = await caches.open(CACHE_NAME);

    // chrome.runtime.getURL('popup.html') does not work in service worker
    if (request.url === "chrome-extension://gicglcbkcocdnjjeanpalgbeammnjcea/popup.html") {
      const cachedResponsePromise = await cache.match(request.url.replace('chrome-extension', 'https'));
      if (cachedResponsePromise !== undefined) {
        console.log("Serving popup from cache");
        console.log(cachedResponsePromise);
        return cachedResponsePromise;
      }
    }

    const cachedResponsePromise = await cache.match(request);
    const networkResponsePromise = fetch(request);

    if (new URL(request.url).protocol !== "chrome-extension:") {
      // precache profile pictures
      console.info("Serving " + request.url + " from cache");
      event.waitUntil(async function () {
        const networkResponse = await networkResponsePromise;

        await cache.put(request, networkResponse.clone());
      }());
    }

    return cachedResponsePromise || networkResponsePromise;
  }());
});

// Clean up caches other than current.
self.addEventListener('activate', event => {
  event.waitUntil(async function () {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames.filter((cacheName) => {
        const deleteThisCache = cacheName !== CACHE_NAME;

        return deleteThisCache;
      }).map(cacheName => caches.delete(cacheName))
    );
    await clients.claim();
  }());
});
