'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Sparkles, Menu, X } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import { LoginPage } from '@/components/LoginPage';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import ConnectNotification from '@/components/ConnectNotification';

function AppContent() {
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleReelSelect = (_categoryId: string, _typeId: string) => {
    void _categoryId;
    void _typeId;
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);

  return (
    <ProtectedRoute fallback={<LoginPage />}>
      <ConnectNotification />
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Layout */}
        <div className="lg:hidden mobile-container">
          {/* Mobile Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-40">
            <div className="px-2 sm:px-4 py-3">
              <div className="flex justify-between items-center max-w-full">
                {/* Logo with Menu Button */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                  >
                    <Menu className="h-5 w-5 text-gray-600" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-900">
                      ReelCraft
                    </h1>
                  </div>
                </div>

                {/* User Actions */}
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="p-2 text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={toggleSidebar}
              ></div>

              {/* Sidebar */}
              <div className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-xl transform transition-transform">
                <div className="flex items-center justify-between p-3 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Account Manager
                  </h2>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <div className="h-full overflow-y-auto">
                  <AccountSwitcher isMobile={true} />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Main Content */}
          <main className="pb-4 w-full overflow-x-hidden mobile-dashboard">
            <div className="w-full">
              <Dashboard onReelSelect={handleReelSelect} />
            </div>
          </main>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex h-screen">
          {/* AccountSwitcher Sidebar */}
          <AccountSwitcher />

          {/* Desktop Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Desktop Header */}
            <header className="bg-white shadow-sm border-b flex-shrink-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                      ReelCraft
                    </h1>
                  </div>
                </div>
              </div>
            </header>

            {/* Desktop Main Content */}
            <main className="flex-1 overflow-y-auto">
              <Dashboard onReelSelect={handleReelSelect} />
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Home() {
  return <AppContent />;
}
