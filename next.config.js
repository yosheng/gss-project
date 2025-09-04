/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
      unoptimized: true,
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'assistant.gss.com.tw',
              port: '',
              pathname: '/**', // 允許該網域下的所有圖片路徑
          },
      ],
  },
};

module.exports = nextConfig;
