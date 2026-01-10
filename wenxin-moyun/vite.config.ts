import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Set base URL for production deployment to Cloud Storage
  base: process.env.NODE_ENV === 'production' 
    ? './' 
    : '/',
  
  // Vite cache optimization for Windows compatibility
  cacheDir: '.vite',
  
  // Production optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Disable in production for security
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        
        // Code splitting optimization
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['framer-motion', '@headlessui/react'],
          charts: ['recharts', 'd3-array', 'd3-scale', 'd3-shape'],
          utils: ['axios', 'clsx', 'zustand'],
          // 大数据文件独立分块 (780KB)
          'exhibition-negative-space': ['./src/data/exhibitions/negative-space']
        }
      }
    },
    
    // Optimize bundle size
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // Already set minify: 'esbuild' above
  },
  
  // Development server configuration with cache fix
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    // Windows file watching optimization - 优化CPU占用
    watch: {
      usePolling: false,  // 使用系统文件监听减少CPU轮询
      interval: 1000      // 降低轮询频率
    },
    // HMR configuration for better reliability
    hmr: {
      overlay: true,
      timeout: 30000      // 从60s降到30s
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimize dependencies with better cache handling
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'framer-motion',
      '@headlessui/react'
    ],
    exclude: ['@vite/client', '@vite/env'],
    // 使用缓存提升启动速度 (移除force:true)
    force: false,
    // Entries to scan for dependencies
    entries: ['src/**/*.tsx', 'src/**/*.ts']
  },
  
  // Module resolution optimization
  resolve: {
    // Preserve symlinks for better module resolution
    preserveSymlinks: false,
    // Optimize extension resolution
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    // Clear module cache on file changes
    dedupe: ['react', 'react-dom']
  }
})
