"use client";

import { useState } from "react";
import { Instagram, ChevronDown, Plus } from "lucide-react";

interface InstagramAccount {
  id: string;
  username: string;
  followers: string;
  isActive: boolean;
}

interface AccountSwitcherProps {
  accounts?: InstagramAccount[];
  onAccountChange?: (account: InstagramAccount) => void;
}

const defaultAccounts: InstagramAccount[] = [
  { id: "1", username: "@motivation_hub", followers: "125K", isActive: true },
  { id: "2", username: "@wisdom_daily", followers: "89K", isActive: false },
  { id: "3", username: "@viral_content", followers: "203K", isActive: false },
];

export function AccountSwitcher({
  accounts = defaultAccounts,
  onAccountChange
}: AccountSwitcherProps) {
  const [activeAccount, setActiveAccount] = useState(
    accounts.find(acc => acc.isActive) || accounts[0]
  );
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const handleAccountSwitch = (account: InstagramAccount) => {
    setActiveAccount(account);
    setShowAccountDropdown(false);
    if (onAccountChange) {
      onAccountChange(account);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Instagram Accounts</h2>

        {/* Active Account */}
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="w-full flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <Instagram className="h-4 w-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{activeAccount.username}</p>
                <p className="text-xs text-gray-600">{activeAccount.followers} followers</p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </button>

          {/* Dropdown */}
          {showAccountDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSwitch(account)}
                  className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors ${
                    account.id === activeAccount.id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{account.username}</p>
                    <p className="text-xs text-gray-600">{account.followers} followers</p>
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-200">
                <button className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:bg-gray-50 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { InstagramAccount };
