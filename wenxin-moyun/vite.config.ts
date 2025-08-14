import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
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
          utils: ['axios', 'clsx', 'zustand']
        }
      }
    },
    
    // Optimize bundle size
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // Terser options for production
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  },
  
  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env']
  }
})
