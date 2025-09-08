"use client";

import { useState, useEffect, useRef } from "react";
import { Instagram, ChevronDown, Plus, LogOut, Users, Settings, ChevronLeft, ChevronRight, Star, TrendingUp, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface InstagramAccount {
  id: string;
  username: string;
  followers: string;
  isActive: boolean;
}

interface AccountSwitcherProps {
  accounts?: InstagramAccount[];
  onAccountChange?: (account: InstagramAccount) => void;
  isMobile?: boolean;
}

const defaultAccounts: InstagramAccount[] = [
  { id: "1", username: "@motivation_hub", followers: "125K", isActive: true },
  { id: "2", username: "@wisdom_daily", followers: "89K", isActive: false },
  { id: "3", username: "@viral_content", followers: "203K", isActive: false },
];

export function AccountSwitcher({
  accounts = defaultAccounts,
  onAccountChange,
  isMobile = false
}: AccountSwitcherProps) {
  const { user, logout } = useAuth();
  const [activeAccount, setActiveAccount] = useState(
    accounts.find(acc => acc.isActive) || accounts[0]
  );
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync activeAccount with accounts prop changes
  useEffect(() => {
    const newActiveAccount = accounts.find(acc => acc.isActive) || accounts[0];
    setActiveAccount(newActiveAccount);
  }, [accounts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAccountSwitch = (account: InstagramAccount) => {
    setActiveAccount(account);
    setShowAccountDropdown(false);
    if (onAccountChange) {
      onAccountChange(account);
    }
  };

  if (isMobile) {
    return (
      <div className="w-full space-y-6">
        {/* User Profile Section */}
        <div className="flex items-center space-x-3 p-4 bg-teal-50 rounded-xl">
          <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              Welcome, {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500">Account Manager</p>
          </div>
        </div>

        {/* Active Account Display */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 px-2">Active Account</h3>
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                <Instagram className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{activeAccount.username}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-teal-500" />
                  <p className="text-xs text-gray-600 truncate">{activeAccount.followers} followers</p>
                </div>
              </div>
              <Star className="h-4 w-4 text-teal-500 fill-current" />
            </div>
          </div>
        </div>

        {/* Account List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 px-2">Switch Account</h3>
          <div className="space-y-2">
            {accounts.filter(account => account.id !== activeAccount.id).map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSwitch(account)}
                className="w-full flex items-center space-x-3 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{account.username}</p>
                  <p className="text-xs text-gray-500 truncate">{account.followers} followers</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Total Reach</span>
              <span className="font-semibold text-gray-900">2.1M</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-teal-600">+12.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full" style={{width: '65%'}}></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200">
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add Account</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">Profile</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64 xl:w-72'
    }`}>
      {/* Header with collapse toggle */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Accounts</h2>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-600 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}>
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                Welcome, {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">Account Manager</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0" title={`Welcome, ${user?.name || 'User'}`}>
              <User className="h-4 w-4 text-white flex-shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Active Account Display */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => !isCollapsed && setShowAccountDropdown(!showAccountDropdown)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'p-2' : 'p-3'} bg-teal-50 border border-teal-200 rounded-xl hover:border-teal-300 transition-all duration-200 group`}
            title={isCollapsed ? activeAccount.username : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'} min-w-0 flex-1`}>
              <div className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} bg-teal-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0`}>
                <Instagram className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-white flex-shrink-0`} />
              </div>
              {!isCollapsed && (
                <div className="text-left min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{activeAccount.username}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-teal-500 flex-shrink-0" />
                    <p className="text-xs text-gray-600 truncate">{activeAccount.followers} followers</p>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showAccountDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Account Dropdown */}
          {showAccountDropdown && !isCollapsed && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSwitch(account)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-all duration-200 ${
                      account.id === activeAccount.id ? 'bg-teal-50 border-l-4 border-teal-500' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Instagram className="h-4 w-4 text-white flex-shrink-0" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{account.username}</p>
                      <p className="text-xs text-gray-500 truncate">{account.followers} followers</p>
                    </div>
                    {account.id === activeAccount.id && (
                      <Star className="h-4 w-4 text-teal-500 fill-current flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-100">
                <button className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:bg-teal-50 transition-colors">
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Add Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-100">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Total Reach</span>
              <span className="font-semibold text-gray-900">2.1M</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-teal-600">+12.5%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-teal-500 h-2 rounded-full" style={{width: '65%'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Actions */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-100 space-y-2`}>
        {!isCollapsed ? (
          <>
            <button className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Profile</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-3 p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        ) : (
          <>
            <button 
              className="w-full p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Profile"
            >
              <User className="h-4 w-4 flex-shrink-0" />
            </button>
            <button 
              className="w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Settings"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
            </button>
            <button 
              onClick={logout}
              className="w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center justify-center"
              title="Logout"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export type { InstagramAccount };
