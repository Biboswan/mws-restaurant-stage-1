/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get PORT() {
    return 1337;
  }

  static get RESTAURANTS_DATABASE_URL() {
    return `http://localhost:${this.PORT}/restaurants`;
  }

  static get REVIEWS_DATABASE_URL() {
    return `http://localhost:${this.PORT}/reviews`;
  }

  static get dbPromise() {
    return this.openDatabase();
  }
  /**
   * Fetch all restaurants
   */
  static fetchRestaurants(callback) {
    if (this.restaurants && this.restaurants.length == 10) {
      return callback(null, this.restaurants);
    }

    this.dbPromise.then(async db => {
      if (db) {
        await this.fetchRestaurantsFrmLocal(db);
        if (this.restaurants.length == 10) {
          return callback(null, this.restaurants);
        }
      }
      this.fetchRestaurantsFromNetwork(callback);
    });
  }
  /**
   * Fetch all restaurants from network
   */
  static fetchRestaurantsFromNetwork(callback) {
    fetch(this.RESTAURANTS_DATABASE_URL)
      .then(response => response.json())
      .then(data => {
        callback(null, data);
        if ('indexedDB' in window) {
          this.fillDatabase(data);
        }
      })
      .catch(err => {
        const error = `Fetch error: ${err}`;
        callback(error, null);
      });
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    this.dbPromise.then(async db => {
      if (db) {
        await this.fetchRestaurantsFrmLocal(db);
        for (const restaurant of this.restaurants) {
          if (restaurant.id == id) {
            return callback(null, restaurant);
          }
        }
      }
      this.fetchRestaurantFromNetwork(id, callback);
    });
  }

  static fetchReviewsById(id, callback) {
    // fetch all reviews with proper error handling.
    this.dbPromise.then(async db => {
      if (db) {
        const reviews = await this.fetchReviewsFrmLocal(db, id);
        if (reviews) {
          return callback(null, reviews);
        }
      }
      this.fetchReviewsFromNetwork(id, callback);
    });
  }

  /**
   * Fetch a restaurant from network by its ID.
   */
  static fetchRestaurantFromNetwork(id, callback) {
    fetch(`${this.RESTAURANTS_DATABASE_URL}/${id}`)
      .then(response => response.json())
      .then(data => {
        if (!data) {
          callback('Restaurant does not exist', null);
        } else {
          callback(null, data);
          if ('indexedDB' in window) {
            this.fillDatabase([data]);
          }
        }
      })
      .catch(err => {
        const error = `Fetch error: ${err}`;
        callback(error, null);
      });
  }

  static fetchReviewsFromNetwork(id, callback) {
    fetch(`${this.REVIEWS_DATABASE_URL}/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(data => {
        if (!data) {
          callback('Reviews does not exist', null);
        } else {
          callback(null, data);
          if ('indexedDB' in window) {
            this.fillReviewsDatabase(data, id);
          }
        }
      })
      .catch(err => {
        const error = `Fetch error: ${err}`;
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `img_res/img/${restaurant.photograph}.jpg`;
  }

  /**
   * Restaurant image URL resized to 400px
   */
  static imageUrlForRestaurant_400(restaurant) {
    return `img_res/${restaurant.photograph}-400.jpg`;
    //return (`img_res/${restaurant.photograph.split('.').join('-400.')}`);
  }

  /**
   * Restaurant image URL resized to 560px
   */
  static imageUrlForRestaurant_560(restaurant) {
    return `img_res/${restaurant.photograph}-560.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP,
    });
    return marker;
  }

  static openDatabase() {
    //check for support
    if (!('indexedDB' in window)) {
      console.log("This browser doesn't support IndexedDB");
      return Promise.resolve();
    }
    return idb.open('restaurant-review-stores', 1, upgradeDb => {
      upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id',
      });
      upgradeDb.createObjectStore('reviews');
    });
  }

  static fillDatabase(items) {
    let tx, store;
    this.dbPromise.then(db => {
      tx = db.transaction('restaurants', 'readwrite');
      store = tx.objectStore('restaurants');
      return Promise.all(items.map(item => store.put(item)))
        .catch(e => {
          tx.abort();
          console.log(e);
        })
        .then(() => {
          console.log('All items added successfully!');
        });
    });
  }

  static fillReviewsDatabase(item, restaurant_id) {
    let tx, store;
    this.dbPromise.then(db => {
      tx = db.transaction('reviews', 'readwrite');
      store = tx.objectStore('reviews');
      store
        .put(item, restaurant_id)
        .catch(e => {
          tx.abort();
          console.log(e);
        })
        .then(() => {
          console.log('item added successfully!');
        });
      return tx.complete;
    });
  }

  static fetchRestaurantsFrmLocal(db) {
    const tx = db.transaction('restaurants');
    const store = tx.objectStore('restaurants');
    store.getAll().then(restaurants => {
      this.restaurants = restaurants;
    });
    return tx.complete;
  }

  static fetchReviewsFrmLocal(db, restaurant_id) {
    const tx = db.transaction('reviews');
    const store = tx.objectStore('reviews');
    return store.get(restaurant_id);
  }

  static toggleFavouriteRestaurantNetwork({ id, is_favorite }) {
    fetch(
      `${this.RESTAURANTS_DATABASE_URL}/${id}/?is_favorite=${!is_favorite}`,
      {
        method: 'PUT',
      }
    )
      .then(response => response.json())
      .then(data => console.log(data));
  }

  static toggleFavouriteRestaurantLocal(db, restaurant) {
    let tx, store;
    tx = db.transaction('restaurants', 'readwrite');
    store = tx.objectStore('restaurants');
    restaurant.is_favorite = !restaurant.is_favorite;
    store.put(restaurant);
    return tx.complete;
  }

  static toggleRestaurantFavourite(restaurant) {
    if ('indexedDB' in window) {
      this.dbPromise.then(async db => {
        if (db) {
          await this.toggleFavouriteRestaurantLocal(db, restaurant);
        }
      });
    }

    this.toggleFavouriteRestaurantNetwork(restaurant);
  }
}
