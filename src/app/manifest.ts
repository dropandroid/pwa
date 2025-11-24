import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Droppurity',
    short_name: 'Droppurity',
    description: 'RO Monitor App by Firebase Studio',
    start_url: '/',
    display: 'fullscreen',
    background_color: '#fff',
    theme_color: '#fff',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
