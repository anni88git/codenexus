export const get = async (key) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('workspace-db', 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore('store');
    request.onsuccess = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('store')) {
        // Edge case if upgrade didn't run properly
        resolve(null);
        return;
      }
      const tx = db.transaction('store', 'readonly');
      const req = tx.objectStore('store').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const set = async (key, val) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('workspace-db', 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore('store');
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('store', 'readwrite');
      tx.objectStore('store').put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};
