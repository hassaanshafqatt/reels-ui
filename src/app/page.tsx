"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, LogOut, Sparkles, Menu, X } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import { LoginPage } from "@/components/LoginPage";
import { AccountSwitcher, InstagramAccount } from "@/components/AccountSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface Account {
  id: string;
  name: string;
  followers: string;
  avatar?: string;
}

const accounts: InstagramAccount[] = [
  { id: 'main_account', username: '@main_account', followers: '12.5K', isActive: true },
  { id: 'business_account', username: '@business_account', followers: '8.2K', isActive: false },
  { id: 'personal_account', username: '@personal_account', followers: '25.1K', isActive: false },
];

function AppContent() {
  const { logout, user } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount>(accounts[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Create dynamic accounts array with proper isActive state
  const dynamicAccounts = accounts.map(account => ({
    ...account,
    isActive: account.id === selectedAccount.id
  }));

  const handleReelSelect = (categoryId: string, typeId: string) => {
    console.log('Selected reel:', { categoryId, typeId });
    // Handle reel selection logic here
  };

  const handleAccountChange = (account: InstagramAccount) => {
    setSelectedAccount(account);
  };

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute fallback={<LoginPage />}>
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
                    <h1 className="text-lg font-bold text-gray-900">ReelCraft</h1>
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
                  <h2 className="text-lg font-semibold text-gray-900">Account Manager</h2>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                <div className="h-full overflow-y-auto pb-20">
                  <div className="p-3">
                    <AccountSwitcher 
                      accounts={dynamicAccounts}
                      onAccountChange={(account) => {
                        handleAccountChange(account);
                        setIsSidebarOpen(false);
                      }}
                      isMobile={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Main Content */}
          <main className="pb-4 w-full overflow-x-hidden mobile-dashboard">
            <div className="w-full">
              <Dashboard 
                onReelSelect={handleReelSelect}
              />
            </div>
          </main>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex h-screen">
          {/* Desktop Sidebar */}
          <AccountSwitcher 
            accounts={dynamicAccounts}
            onAccountChange={handleAccountChange}
            isMobile={false}
          />

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
                    <h1 className="text-xl font-bold text-gray-900">ReelCraft</h1>
                  </div>
                </div>
              </div>
            </header>

            {/* Desktop Main Content */}
            <main className="flex-1 overflow-y-auto">
              <Dashboard 
                onReelSelect={handleReelSelect}
              />
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


