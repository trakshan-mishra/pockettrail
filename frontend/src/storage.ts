import type { SavedWalk, WalkMeasurement } from './types';

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('pockettrail', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('walks', { keyPath: 'pack.id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(new Error('Your browser could not open offline storage.')); };
  });
  return database;
}
export async function saveWalk(walk: SavedWalk) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('walks', 'readwrite');
    transaction.objectStore('walks').put(walk);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('There is not enough device storage to save this walk.'));
    transaction.onabort = () => reject(new Error('This walk could not be saved.'));
  });
}
export async function listWalks(): Promise<SavedWalk[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('walks').objectStore('walks').getAll();
    request.onsuccess = () => resolve((request.result as SavedWalk[]).sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    request.onerror = () => reject(new Error('Saved walks could not be read.'));
  });
}
export async function saveMeasurement(id: string, measurement: WalkMeasurement) {
  const db = await openDatabase();
  return new Promise<void>((resolve,reject) => {
    const transaction = db.transaction('walks','readwrite');
    const store = transaction.objectStore('walks');
    const request = store.get(id);
    request.onsuccess = () => {if(request.result)store.put({...request.result,measurement});};
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Walk measurements could not be saved on this device.'));
    transaction.onabort = () => reject(new Error('Walk measurements could not be saved on this device.'));
  });
}
export async function deleteWalk(id: string) {
  const db = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('walks', 'readwrite');
    transaction.objectStore('walks').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('The walk could not be removed.'));
  });
}
