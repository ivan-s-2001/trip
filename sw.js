const CACHE = "trip-v23";

const CORE = [
  "./",
  "./index.html",
  "./styles.css",
  "./content.js",
  "./app.js",
  "./sync.js",
  "./messages.js",
  "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./assets/icons/bootstrap/heart-fill.svg",
  "./assets/icons/bootstrap/airplane-fill.svg",
  "./assets/icons/bootstrap/house-heart-fill.svg",
  "./assets/icons/bootstrap/geo-alt-fill.svg",
  "./assets/icons/bootstrap/camera-fill.svg",
  "./assets/icons/bootstrap/mic-fill.svg",
  "./assets/icons/bootstrap/clock-fill.svg",
  "./assets/icons/bootstrap/check-circle-fill.svg",
  "./assets/icons/bootstrap/arrow-right.svg",
  "./assets/icons/bootstrap/x-lg.svg"
];

const OPTIONAL_MEDIA = [
  "./assets/photos/intro-family.jpg",
  "./assets/photos/home-01.jpg",
  "./assets/photos/home-02.jpg",
  "./assets/photos/home-03.jpg",
  "./assets/photos/miss-you.jpg",
  "./assets/audio/before-flight.m4a",
  "./assets/audio/goodnight-12.m4a",
  "./assets/photos/day10-us.jpg",
  "./assets/photos/home-cats-01.jpg",
  "./assets/photos/home-cats-02.jpg",
  "./assets/photos/home-cats-03.jpg",
  "./assets/photos/home-waiting.jpg",
  "./assets/photos/her-01.jpg",
  "./assets/photos/memory-01.jpg",
  "./assets/photos/then.jpg",
  "./assets/photos/now.jpg",
  "./assets/photos/anniversary-01.jpg",
  "./assets/audio/voice-10.mp3",
  "./assets/audio/voice-12.mp3",
  "./assets/audio/voice-14.mp3",
  "./assets/audio/voice-16.mp3",
  "./assets/audio/voice-17.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async cache => {
        await cache.addAll(CORE);
        await Promise.all(OPTIONAL_MEDIA.map(async url => {
          try {
            const response = await fetch(url, {cache:"no-store"});
            if (response.ok) await cache.put(url, response);
          } catch (_) {}
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === "navigate";
  const isAppShell = /\/(index\.html|styles\.css|content\.js|sync\.js|messages\.js|app\.js|manifest\.webmanifest)$/.test(url.pathname);

  if (isNavigation || isAppShell) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(async () => {
          const hit = await caches.match(event.request);
          return hit || caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async cached => {
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      } catch (_) {
        return new Response("", {status: 504, statusText: "Offline"});
      }
    })
  );
});