//service worker
var staticCacheName = 'headline-static-v2';
var staticImgsCache = 'headline-static-imgs';
var contentImgsCache = 'headline-content-imgs';

var allCaches = [
  staticCacheName,
  staticImgsCache,
  contentImgsCache
];

var staticFilesToCache = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/js/app.js',
  '/src/js/localforage-1.4.0.js',
  '/favicon.ico',
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(staticFilesToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          console.log('[ServiceWorker] Removing old cache', cacheName);
          return cacheName.startsWith('headline-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});


self.addEventListener('fetch', function(event) {
  // console.log('[ServiceWorker] Fetch', event.request.url);

  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {    
    // get images from my origin and store them locally
    if (requestUrl.pathname.startsWith('/src/images/')) {
      event.respondWith(serveImages(event.request, staticImgsCache));
      return;
    }

  }

  if (requestUrl.origin !== location.origin) {    
    // get images from other origins and store them locally
    if (event.request.destination === 'image') {
      event.respondWith(serveImages(event.request, contentImgsCache));
      return;
    }   
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;

      return fetch(event.request).then(function(response) {
        // console.log('[ServiceWorker] Response', response);
        if (response.status === 403) {
          return caches.match('src/images/noimage.png') || 'src/images/noimage.png';
        }
        return response
      });
    })
  );

});

function serveImages(request, cacheName) {
    var storageUrl = (cacheName == staticImgsCache) ? request.url : request.url.split('/')[request.url.split('/').length - 1];
    console.log(cacheName, storageUrl);

    return caches.open(cacheName).then(function(cache) {
      return cache.match(storageUrl).then(function(response) {
        if (response) return response;

        return fetch(request).then(function(networkResponse) {
          cache.put(storageUrl, networkResponse.clone());
          return networkResponse;
        });
      });
    });
  }

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

