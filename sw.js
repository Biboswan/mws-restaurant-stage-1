const staticCacheName = 'restaurantreviews-static-v1';
const contentImgsCache = 'restaurantreviews-content-v1';
const syncStore = {};
const allCaches = [staticCacheName, contentImgsCache];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(cache => {
        return cache.addAll([
          new Request('index.html', { cache: 'no-cache' }),
          new Request('restaurant.html', { cache: 'no-cache' }),
          new Request('js/all.js', { cache: 'no-cache' }),
          new Request('js/main.js', { cache: 'no-cache' }),
          new Request('js/restaurant_info.js', { cache: 'no-cache' }),
          new Request('css/styles.css', { cache: 'no-cache' }),
          new Request('manifest.json', { cache: 'no-cache' }),
          new Request('https://unpkg.com/leaflet@1.3.1/dist/leaflet.css', {
            mode: 'cors',
          }),
          new Request('https://unpkg.com/leaflet@1.3.1/dist/leaflet.js', {
            mode: 'cors',
          }),
          'icons/RR-32.png',
          'filter.png',
          'placeholder.png',
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith('restaurantreviews-') &&
              !allCaches.includes(cacheName)
            );
          })
          .map(cacheName => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
    if (requestUrl.pathname.startsWith('/img_res/')) {
      event.respondWith(serveImage(event.request));
      // Cache only original (highest resolution) image
      return;
    }

    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

/**
 * Here we are dynamically caching restaurant images. Due to space limit, we shouldn't cache images of all sizes.
 * So we cache 560px image for both 400px and 560px requirement to able to serve images for both index and
 * restaurant html pages.
 */
const serveImage = request => {
  let storageUrl;
  if (request.url.includes('-400')) {
    storageUrl = request.url.replace('400', '560');
  } else {
    storageUrl = request.url;
  }
  const modifyreq = new URL(storageUrl);

  return caches.open(contentImgsCache).then(cache => {
    return cache.match(modifyreq).then(response => {
      return (
        response ||
        fetch(modifyreq).then(networkResponse => {
          cache.put(storageUrl, networkResponse.clone());
          return networkResponse;
        })
      );
    });
  });
};

const addNewReviewLocal = data => {
  return openDatabase().then(db => {
    const tx = db.transaction('reviews', 'readwrite');
    const store = tx.objectStore('reviews');
    const { restaurant_id } = data;
    return store.get(restaurant_id).then(async reviews => {
      //delete review which was added to indexdb without contacting the server (lacking review id)
      const updated_reviews = reviews.filter(review => review.id);
      updated_reviews.unshift(data);
      await store.put(updated_reviews, restaurant_id);
      return tx.complete;
    });
  });
};

self.addEventListener('sync', event => {
  // get the data by tag
  const { url, options } = syncStore[event.tag];
  event.waitUntil(
    fetch(url, options)
      .then(response => response.json())
      .then(data => {
        addNewReviewLocal(data);
      })
      .then(() => {
        delete syncStore[event.tag];
      })
  );
});

self.addEventListener('message', event => {
  const { type, payload } = event.data;
  if (type === 'ADD_REVIEW_SYNC') {
    // get a unique id to save the data
    const id = Date.now();
    syncStore[id] = payload;
    console.log(payload);
    // register a sync and pass the id as tag for it to get the data
    self.registration.sync.register(id);
  }
});
