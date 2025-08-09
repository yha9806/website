import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0D1117] transition-colors duration-200">
      {/* 微妙的网格背景 - 仅在深色模式显示 */}
      <div className="fixed inset-0 dark:opacity-[0.02] opacity-0 transition-opacity duration-200" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100' height='100' fill='none'/%3E%3Cpath d='M0 0L100 0M0 0L0 100' stroke='%2358A6FF' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 100px'
      }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}