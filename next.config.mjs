import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 暂时禁用 standalone 输出模式，避免 Windows + pnpm 的符号链接权限问题
  // 如需 Docker 部署，请取消注释以下行：
  // output: 'standalone',
  
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
