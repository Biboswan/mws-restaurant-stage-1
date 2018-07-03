const staticCacheName = 'restaurantreviews-static-v1';
const contentImgsCache = 'restaurantreviews-content-v1';
const allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', event => {
	self.skipWaiting();

  event.waitUntil(
		caches.open(staticCacheName).then(cache => {
			return cache.addAll([
				new Request('/index.html', { cache: 'no-cache' } ),
				new Request('/restaurant.html', { cache: 'no-cache' }),
				new Request('/js/dbhelper.js', { cache: 'no-cache' }),
			  new Request('/js/main.js', { cache: 'no-cache' }),
				new Request('/js/restaurant_info.js', { cache: 'no-cache' }),
				new Request('/build/css/styles.css', { cache: 'no-cache' }),
				'/js/controller.js',
				'/filter.png', 
				'/data/restaurants.json'
			]);
		}).then( () => self.skipWaiting())
	);
});

self.addEventListener('activate', event => {
  event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					return cacheName.startsWith('restaurantreviews-') &&
								 !allCaches.includes(cacheName);
				}).map(cacheName => {
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
		caches.match(event.request,{"ignoreSearch":true}).then(response => {
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
	request.url = storageUrl;

	return caches.open(contentImgsCache).then(cache => {
		return cache.match(storageUrl).then(response => {
			if (response) return response;

			return fetch(request).then(networkResponse => {
				cache.put(storageUrl, networkResponse.clone());
				return networkResponse;
			});
		});
	});
};
