/* Fable Blast — service worker
   Oyun kabuğunu önbelleğe alır: ilk açılıştan sonra internetsiz çalışır.
   Firebase istekleri araya girilmeden ağa bırakılır (skorlar internet ister).
   NOT: Oyunu güncellediğinde aşağıdaki sürüm adını değiştir (v1 -> v2). */
var CACHE = 'fable-blast-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  // Firebase ve diğer dış istekler: ağa bırak (çevrimdışıysa oyun zaten bekletiyor)
  if(url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
