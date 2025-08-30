"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, CheckCircle } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import { LoginPage } from "@/components/LoginPage";
import { AccountSwitcher, InstagramAccount } from "@/components/AccountSwitcher";

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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<InstagramAccount>(accounts[0]);

  const handleLogin = (email: string, password: string) => {
    // Here you would typically validate credentials with your backend
    console.log('Login attempt:', { email, password });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const handleReelSelect = (categoryId: string, typeId: string) => {
    console.log('Selected reel:', { categoryId, typeId });
    // Handle reel selection logic here
  };

  const handleAccountChange = (account: InstagramAccount) => {
    setSelectedAccount(account);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AccountSwitcher
        accounts={accounts}
        onAccountChange={handleAccountChange}
      />

      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Reel Generator</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Connected: <span className="font-medium text-teal-600">
                  {selectedAccount.username}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800"
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        <Dashboard onReelSelect={handleReelSelect} />
      </div>
    </div>
  );
}


