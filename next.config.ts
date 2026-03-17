import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  async rewrites() {
    return [
      {
        source: '/lexrag-app',
        destination: 'http://localhost:5173/lexrag-app/',
      },
      {
        source: '/lexrag-app/:path*',
        destination: 'http://localhost:5173/lexrag-app/:path*',
      },
      {
        source: '/src/:path*',
        destination: 'http://localhost:5173/src/:path*',
      },
      {
        source: '/@vite/:path*',
        destination: 'http://localhost:5173/@vite/:path*',
      },
      {
        source: '/@react-refresh',
        destination: 'http://localhost:5173/@react-refresh',
      },
      {
        source: '/node_modules/:path*',
        destination: 'http://localhost:5173/node_modules/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      }
    ];
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
