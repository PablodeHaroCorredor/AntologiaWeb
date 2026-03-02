import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  sw: 'sw.js',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i1.sndcdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'a1.sndcdn.com', pathname: '/**' },
    ],
  },
};

export default withPWA(nextConfig);
