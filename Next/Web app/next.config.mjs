import withPWA from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const runtimeCaching = [
  {
    urlPattern: /\/tasks/, // Task list
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "tasks-cache",
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  },
  {
    urlPattern: /\/api\/(auth|login)/,
    handler: "NetworkOnly",
    options: {
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  },
  {
    urlPattern: ({ request }) => ["style", "script", "font"].includes(request.destination),
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  },
  {
    urlPattern: ({ request }) => request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "image-cache",
      expiration: {
        maxEntries: 300,
        maxAgeSeconds: 30 * 24 * 60 * 60
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "google-fonts-stylesheets"
    }
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts-webfonts",
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60
      },
      cacheableResponse: {
        statuses: [0, 200]
      }
    }
  }
];

const withPWAConfig = withPWA({
  dest: "public",
  sw: "sw.js",
  register: true,
  skipWaiting: true,
  disable: isDev,
  runtimeCaching,
  customWorkerSrc: "worker",
  fallbacks: {
    document: "/~offline"
  },
  buildExcludes: [/middleware-manifest\.json$/]
});

export default withPWAConfig(nextConfig);
