/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Three.js and related libraries
    config.externals = config.externals || []

    // Don't externalize these packages on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Transpile specific packages that need it
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/(three|@react-three|@takram|3d-tiles-renderer)/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })

    return config
  },
}

export default nextConfig
