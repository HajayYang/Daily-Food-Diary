// The browser retains its existing storage; the desktop bridge persists in SQLite.
// Resolve browser storage lazily so disabled storage never breaks module loading.
export const isDesktop = Boolean(globalThis.dailyBitesDesktop?.isDesktop);
export const localStore = {
  getItem(key) { return isDesktop ? globalThis.dailyBitesDesktop.storage.get(key) : globalThis.localStorage.getItem(key); },
  setItem(key,value) { if(isDesktop) globalThis.dailyBitesDesktop.storage.set(key,String(value)); else globalThis.localStorage.setItem(key,String(value)); },
  removeItem(key) { if(isDesktop) globalThis.dailyBitesDesktop.storage.remove(key); else globalThis.localStorage.removeItem(key); },
  ...(isDesktop ? {atomicWrite(changes){ globalThis.dailyBitesDesktop.storage.batch(changes); }} : {})
};
export function storageKeys() { return isDesktop ? globalThis.dailyBitesDesktop.storage.keys() : Object.keys(globalThis.localStorage); }
