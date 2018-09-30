let restaurants, neighborhoods, cuisines, pressed;
let markers = [];
let newMap;

//const map = document.querySelector('.map');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  initMap();
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize  map, called from HTML.
 */
const initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false,
  });
  L.tileLayer(
    'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}',
    {
      mapboxToken:
        'pk.eyJ1IjoiYmlib3N3YW4iLCJhIjoiY2ptb3Rnd3B4MTRncjNwbzdzeW40N3l3dyJ9.fEvDf70hxJqycVH3x55nJw',
      maxZoom: 18,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets',
    }
  ).addTo(newMap);
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.querySelector('.restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.querySelector('.restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  lazyload();
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.classList.add('lazy');
  image.src = 'placeholder.jpg';
  image.dataset.src = DBHelper.imageUrlForRestaurant_400(restaurant);

  let image2x = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.srcset = `${image.dataset.src} 1x, ${image2x} 2x`;
  image.alt = `Photo of restaurant ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const endrow = document.createElement('div');
  endrow.classList.add('flex-container');
  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.classList.add('view-details');
  endrow.append(more);

  // Toggle Heart to favorite restaurant
  const favourite = document.createElement('i');
  favourite.id = restaurant.id;
  favourite.setAttribute('role', 'switch');
  favourite.setAttribute('aria-checked', restaurant.is_favorite);
  favourite.classList.add('heart');
  if (restaurant.is_favorite) favourite.classList.add('favourite-checked');
  favourite.onclick = e => {
    DBHelper.toggleRestaurantFavourite(restaurant);
    const ischecked = favourite.getAttribute('aria-checked') == true;
    favourite.setAttribute('aria-checked', !ischecked);
    favourite.classList.toggle('favourite-checked');
  };
  favourite.innerHTML = 'Favorite';
  endrow.append(favourite);
  li.append(endrow);
  return li;
};

lazyload = () => {
  const lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

  if ('IntersectionObserver' in window) {
    let lazyImageObserver = new IntersectionObserver(function(
      entries,
      observer
    ) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
};

/**
 * Implement off canvas layout for filter options bar
 */
const filteroptions = document.querySelector('.filter-options');
const filtericon = document.querySelector('.filter-icon');
filtericon.onclick = e => {
  filteroptions.classList.toggle('open');

  pressed = filtericon.getAttribute('aria-pressed') === 'true';
  // Change aria-pressed to the opposite state
  filtericon.setAttribute('aria-pressed', !pressed);
};
