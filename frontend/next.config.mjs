/** @type {import('next').NextConfig} */
const nextConfig = {
  // De 'output: standalone' is vooral voor productiedocker images.
  // We kunnen deze lokaal uitschakelen of weglaten.
  // We laten deze weg om de configuratie minimaal te houden, tenzij je deze specifiek nodig hebt.
  // We houden 'reactStrictMode: true' voor de beste ontwikkelkwaliteit.
  reactStrictMode: true,

  // BELANGRIJK: De experimental sectie wordt verwijderd.
  // De App Router (appDir) is nu standaard en de waarschuwing verdwijnt hierdoor.
  
  // Voeg de externe afbeeldingenhosts toe voor jouw S3-integratie (nodig bij een echte S3 URL)
  // Dit is een professionele must-have zodra je live gaat.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com', // Standaard AWS S3 domein
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
