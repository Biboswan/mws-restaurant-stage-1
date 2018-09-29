const openDatabase = () => {
  return idb.open('restaurant-review-stores', 2, upgradeDb => {
    upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id',
    });
    upgradeDb.createObjectStore('reviews');
  });
};
