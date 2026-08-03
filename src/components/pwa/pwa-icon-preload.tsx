/**
 * Prefetch PWA / home-screen icons so the install prompt has assets ready.
 */
export function PwaIconPreload() {
  return (
    <>
      <link rel="preload" href="/icons/icon-192.png" as="image" type="image/png" />
      <link rel="preload" href="/icons/icon-512.png" as="image" type="image/png" />
      <link rel="preload" href="/icons/apple-touch-icon.png" as="image" type="image/png" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
      <link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192" />
      <link rel="icon" href="/icons/icon-512.png" type="image/png" sizes="512x512" />
    </>
  );
}
