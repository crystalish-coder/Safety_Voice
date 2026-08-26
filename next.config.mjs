/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pubchem.ncbi.nlm.nih.gov',
      },
    ],
  },
};

export default nextConfig;
