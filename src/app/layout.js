import { AuthProvider } from '../components/AuthContext';
import { CartProvider } from '../components/CartContext';
import { ThemeProvider } from '../lib/ThemeContext';
import Header from '../components/Header';

import './globals.css';

export const metadata = {
  title: 'Online Bookstore',
  description: 'A simple bookstore app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
               
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
              </div>
              
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}