/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hbnvezwqptuwhtouvzlh.supabase.co",
      },
    ],
    unoptimized: true,
  },
}

export default nextConfig
