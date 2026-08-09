const CACHE_PREFIX = "little-steps-pwa";
const CACHE_VERSION = "v9-development-hero-layout";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/assets/app-icons/apple-touch-icon.png",
  "/assets/app-icons/icon-192.png",
  "/assets/app-icons/icon-512.png",
  "/assets/app-icons/icon-maskable-512.png",
  "/assets/baby/final-screens/zh-CN/01-home-dynamic-add-clean.png",
  "/assets/baby/final-screens/zh-CN/02-memory-book-home-paper-v1.png",
  "/assets/baby/final-screens/zh-CN/03-growth-curve.png",
  "/assets/baby/final-screens/zh-CN/04-health-record.png",
  "/assets/baby/final-screens/zh-CN/05-early-education-add-clean-home-paper-v1.png",
  "/assets/baby/final-screens/zh-CN/06-study-record-add-clean-home-paper-v1.png",
  "/assets/baby/home-name-regular-script-v2.png",
  "/assets/baby/home-tagline-growing-v2.png",
  "/assets/baby/paper-texture.png",
  "/assets/baby/paper-texture-home-v1.png",
  "/assets/baby/icon-age.png",
  "/assets/baby/icon-health.png",
  "/assets/baby/nav-home.png",
  "/assets/baby/nav-memory.png",
  "/assets/baby/nav-growth.png",
  "/assets/baby/nav-health.png",
  "/assets/baby/nav-education.png",
  "/assets/baby/nav-study.png",
  "/assets/baby/health-title-syringe-v1.png",
  "/assets/baby/health-title-shield-v1.png",
  "/assets/baby/health-title-shield-cluster-v1.png",
  "/assets/baby/health-vaccine-hepb-v1.png",
  "/assets/baby/health-vaccine-five-in-one-v1.png",
  "/assets/baby/health-vaccine-mmr-v1.png",
  "/assets/baby/health-footer-illustration-v2.png",
  "/assets/baby/health-intro-companions-v1.png",
  "/assets/baby/health-development-flag-v1.png",
  "/assets/baby/health-development-rollover-v1.png",
  "/assets/baby/health-development-sitting-v1.png",
  "/assets/baby/health-development-crawling-v1.png",
  "/assets/baby/health-checkup-stethoscope-v1.png",
  "/assets/baby/health-checkup-newborn-v2.png",
  "/assets/baby/health-checkup-one-month-v2.png",
  "/assets/baby/health-checkup-four-month-v2.png",
  "/assets/baby/health-vaccine-hero-reference-v2.png",
  "/assets/baby/health-development-hero-bear-reference-v2.png",
  "/assets/baby/health-development-hero-bear-reference-v3.png",
  "/assets/baby/health-development-hero-baby-reference-v2.png",
  "/assets/baby/health-development-hero-baby-reference-v3.png",
  "/assets/baby/health-checkup-hero-bear-reference-v2.png",
  "/assets/baby/health-checkup-hero-stethoscope-reference-v2.png",
  "/assets/baby/health-development-tummy-time-reference-v2.png",
  "/assets/baby/health-development-rollover-reference-v2.png",
  "/assets/baby/health-development-sitting-reference-v2.png",
];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(CORE_ASSETS);

  const indexResponse = await fetch("/index.html", { cache: "no-store" });
  if (!indexResponse.ok) return;

  await cache.put("/index.html", indexResponse.clone());
  const html = await indexResponse.text();
  const sameOriginAssets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/") && !url.startsWith("//"));

  await Promise.allSettled(sameOriginAssets.map((url) => cache.add(url)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/index.html"));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (["script", "style"].includes(request.destination)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
