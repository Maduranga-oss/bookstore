import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import { ThemeProvider } from '../lib/ThemeContext';
import Header from '../components/Header';

import './globals.css';

export const metadata = {
  title: 'BookHub - Premium Online Bookstore',
  description: 'Discover and purchase your next favorite book from our curated collection',
  keywords: 'books, bookstore, online books, reading, literature',
  authors: [{ name: 'BookHub' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
                <Header />
                <main className="relative">
                  {/* Background decoration */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-32 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl"></div>
                  </div>
                  
                  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                  </div>
                </main>
                
                {/* Footer */}
                <footer className="relative border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-slate-600 dark:text-slate-400">
                      <p className="text-sm">
                        &copy; 2024 BookHub. Crafted with ❤️ for book lovers worldwide.
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}