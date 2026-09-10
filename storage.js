// Handles local storage operations for username authentication
const StorageManager = {
  getUsername() {
    return localStorage.getItem('vstrike_username') || '';
  },

  setUsername(name) {
    if (name && name.trim()) {
      localStorage.setItem('vstrike_username', name.trim());
      return true;
    }
    return false;
  },

  clearUsername() {
    localStorage.removeItem('vstrike_username');
  }
};

window.StorageManager = StorageManager;
