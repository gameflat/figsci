import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // config options stay aligned with the TS version; extend as needed
  webpack: (config) => {
    // Ensure .jsx files are resolved correctly
    config.resolve.extensions = [
      '.js',
      '.jsx',
      '.mjs',
      '.json',
      ...(config.resolve.extensions || []),
    ];
    
    // Configure path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    return config;
  },
};

export default nextConfig;
