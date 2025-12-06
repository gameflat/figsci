import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 standalone 输出模式，优化 Docker 部署
  // 这会生成一个独立的 server.js 文件，包含所有必要的依赖
  output: 'standalone',
  
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
