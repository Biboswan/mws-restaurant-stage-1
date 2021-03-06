let restaurant;

/**
 * Initialize  map, called from HTML.
 */

document.addEventListener('DOMContentLoaded', event => {
  initMap();
});

const initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      ).addTo(self.newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });

    DBHelper.fetchReviewsById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }

      // fill reviews
      fillReviewsHTML();
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  // Insert url and query to fetch correct size image with the properties of picture tag and srcset attribute
  let imagesource = document.getElementById('restaurant-img-source1');
  let image400 = DBHelper.imageUrlForRestaurant_400(restaurant);
  let image560 = DBHelper.imageUrlForRestaurant_560(restaurant);
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = `${image560} 1x, ${image.src} 2x`;
  image.alt = `Photo of restaurant ${restaurant.name}`;
  imagesource.srcset = `${image400} 400w, ${image560} 560w, ${image.src} 800w`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  const tbody = document.createElement('tbody');
  hours.appendChild(tbody);
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    tbody.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  if (reviews.length === 0) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  li.classList.add('list');
  const ul = document.createElement('ul');
  const name = document.createElement('li');
  name.classList.add('reviewer-name');
  name.innerHTML = review.name;
  ul.appendChild(name);

  const date = document.createElement('li');
  const temp = Date(review.updatedAt).split(' ');
  date.innerHTML = [temp[1], temp[2] + ',', temp[3]].join(' ');
  date.classList.add('review-date');

  ul.appendChild(date);
  li.appendChild(ul);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add('reviwer-rating');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('reviwer-comment');
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.querySelector('.breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

onReviewCancel = () => {
  const review_form = document.querySelector('.review-form');
  const add_review = document.querySelector('#add-review-btn');
  review_form.classList.add('show-none');
  add_review.style.display = 'block';
};

onReviewSubmit = () => {
  const review_form = document.querySelector('.review-form');

  if (!review_form.checkValidity()) {
    return review_form.reportValidity();
  }

  //Extract form data
  const name = review_form['name'].value;
  const rating = review_form['rating'].value;
  const comments = review_form['comments'].value;
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  // Data to be send
  let postData = { restaurant_id: id, name, rating, comments };
  DBHelper.addNewReview(postData, review => {
    onReviewCancel();
    const ul = document.getElementById('reviews-list');
    ul.insertAdjacentElement('afterbegin', createReviewHTML(review));
  });
};

showReviewForm = () => {
  const add_review = document.querySelector('#add-review-btn');
  const review_form = document.querySelector('.review-form');
  add_review.style.display = 'none';
  review_form.classList.remove('show-none');
};
