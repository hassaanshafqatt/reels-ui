'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  ChevronDown,
  Plus,
  LogOut,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  User,
  Youtube,
  Music,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';

interface SocialAccount {
  id: string;
  platform: 'instagram' | 'youtube' | 'tiktok';
  username: string;
  accountId: string;
  connectedAt: string;
  platformData: {
    name: string;
    icon: string;
    color: string;
    followers: string;
  };
  profileImage?: string | null;
}

interface AccountSwitcherProps {
  onAccountChange?: (account: SocialAccount) => void;
  isMobile?: boolean;
}

const PLATFORM_META: Record<
  SocialAccount['platform'],
  { label: string; color: string }
> = {
  instagram: { label: 'IG', color: 'from-pink-500 to-purple-600' },
  youtube: { label: 'YT', color: 'bg-red-600' },
  tiktok: { label: 'TT', color: 'bg-black' },
};

// defaultAccounts removed — accounts are fetched from server for authenticated users

export function AccountSwitcher({
  onAccountChange,
  isMobile = false,
}: AccountSwitcherProps) {
  const { user, logout } = useAuth();
  const [activeAccount, setActiveAccount] = useState<SocialAccount | null>(
    null
  );
  const [userAccounts, setUserAccounts] = useState<SocialAccount[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);
  const [_isLoading, setIsLoading] = useState(true);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] =
    useState<SocialAccount | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/accounts');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserAccounts(data.accounts);
            if (data.accounts.length > 0) {
              setActiveAccount(data.accounts[0]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchAccounts();
    }
  }, [user]);

  // Sync activeAccount with accounts prop changes
  useEffect(() => {
    if (userAccounts.length > 0) {
      setActiveAccount(userAccounts[0]);
    }
  }, [userAccounts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAccountSwitch = (account: SocialAccount) => {
    setActiveAccount(account);
    setShowAccountDropdown(false);
    if (onAccountChange) {
      onAccountChange(account);
    }
  };

  const handleAddAccount = () => {
    setShowPlatformDialog(true);
  };

  const handlePlatformSelect = async (
    platform: 'instagram' | 'youtube' | 'tiktok'
  ) => {
    setShowPlatformDialog(false);

    if (platform === 'instagram') {
      // Redirect to Instagram OAuth
      window.location.href = '/api/auth/instagram/initiate';
    } else if (platform === 'tiktok') {
      // Redirect to TikTok OAuth
      window.location.href = '/api/auth/tiktok/initiate';
    } else if (platform === 'youtube') {
      // Redirect to YouTube OAuth
      window.location.href = '/api/auth/youtube/initiate';
    } else {
      // For now, just show a message for other platforms
      alert(`${platform} integration coming soon!`);
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
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Active Account
          </h3>
          {activeAccount ? (
            <div className="p-4 bg-white border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                  {activeAccount?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeAccount.profileImage}
                      alt={activeAccount.username}
                      className="w-full h-full object-cover"
                    />
                  ) : activeAccount.platform === 'instagram' ? (
                    <Instagram className="h-5 w-5 text-white" />
                  ) : activeAccount.platform === 'youtube' ? (
                    <Youtube className="h-5 w-5 text-white" />
                  ) : (
                    <Music className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {activeAccount.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activeAccount.platformData.name}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-teal-500" />
                    <p className="text-xs text-gray-600 truncate">
                      {activeAccount.platformData.followers} followers
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      setAccountToDisconnect(activeAccount);
                      setShowConfirmDisconnect(true);
                    }}
                  >
                    Disconnect
                  </button>
                  <Star className="h-4 w-4 text-teal-500 fill-current" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <p className="text-sm text-gray-500">No accounts connected</p>
              <p className="text-xs text-gray-400 mt-1">
                Add an account to get started
              </p>
            </div>
          )}
        </div>

        {/* Account List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 px-2">
            Switch Account
          </h3>
          <div className="space-y-2">
            {userAccounts
              .filter((account) =>
                activeAccount ? account.id !== activeAccount.id : true
              )
              .map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSwitch(account)}
                  className="w-full flex items-center space-x-3 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center overflow-hidden">
                    {account.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={account.profileImage}
                        alt={account.username}
                        className="w-full h-full object-cover"
                      />
                    ) : account.platform === 'instagram' ? (
                      <Instagram className="h-5 w-5 text-white" />
                    ) : account.platform === 'youtube' ? (
                      <Youtube className="h-5 w-5 text-white" />
                    ) : (
                      <Music className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {account.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {account.platformData.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {account.platformData.followers} followers
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Quick Stats
          </h3>
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
              <div
                className="bg-teal-500 h-2 rounded-full"
                style={{ width: '65%' }}
              ></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleAddAccount}
            className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200"
          >
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

        {/* Platform Selection Dialog (mobile) */}
        {showPlatformDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connect Social Account
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose a platform to connect your account
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handlePlatformSelect('instagram')}
                  className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="font-medium">Instagram</span>
                </button>

                <button
                  onClick={() => handlePlatformSelect('youtube')}
                  className="w-full flex items-center space-x-3 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                >
                  <Youtube className="h-5 w-5" />
                  <span className="font-medium">YouTube</span>
                </button>

                <button
                  onClick={() => handlePlatformSelect('tiktok')}
                  className="w-full flex items-center space-x-3 p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
                >
                  <Music className="h-5 w-5" />
                  <span className="font-medium">TikTok</span>
                </button>
              </div>

              <button
                onClick={() => setShowPlatformDialog(false)}
                className="w-full mt-4 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Confirm Disconnect Dialog (mobile) */}
        <Dialog
          open={showConfirmDisconnect}
          onOpenChange={setShowConfirmDisconnect}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect account</DialogTitle>
              <DialogDescription>
                Are you sure you want to disconnect this account? This will
                remove the connection from your profile but will not delete any
                generated content.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                  {accountToDisconnect?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={accountToDisconnect.profileImage}
                      alt={accountToDisconnect.username}
                      className="w-full h-full object-cover"
                    />
                  ) : accountToDisconnect?.platform === 'instagram' ? (
                    <Instagram className="h-5 w-5 text-gray-400" />
                  ) : accountToDisconnect?.platform === 'youtube' ? (
                    <Youtube className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Music className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {accountToDisconnect?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {accountToDisconnect?.platformData.name}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setShowConfirmDisconnect(false)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!accountToDisconnect) return;
                  try {
                    const res = await fetch(
                      `/api/accounts/${accountToDisconnect.id}`,
                      { method: 'DELETE' }
                    );
                    if (res.ok) {
                      setUserAccounts((prev) =>
                        prev.filter((a) => a.id !== accountToDisconnect.id)
                      );
                      if (activeAccount?.id === accountToDisconnect.id) {
                        setActiveAccount(null);
                      }
                      setShowConfirmDisconnect(false);
                      setAccountToDisconnect(null);
                    } else {
                      alert('Failed to disconnect account');
                    }
                  } catch (err) {
                    console.error('Failed to disconnect account', err);
                    alert('Failed to disconnect account');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Disconnect
              </button>
            </DialogFooter>
            <DialogClose onClose={() => setShowConfirmDisconnect(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div
      className={`bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64 xl:w-72'
      }`}
    >
      {/* Header with collapse toggle */}
      <div
        className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}
      >
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}
        >
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
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
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
      <div
        className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}
      >
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
            <div
              className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0"
              title={`Welcome, ${user?.name || 'User'}`}
            >
              <User className="h-4 w-4 text-white flex-shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Active Account Display */}
      <div
        className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}
      >
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() =>
              !isCollapsed && setShowAccountDropdown(!showAccountDropdown)
            }
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'p-2' : 'p-3'} bg-teal-50 border border-teal-200 rounded-xl hover:border-teal-300 transition-all duration-200 group`}
            title={
              isCollapsed && activeAccount ? activeAccount.username : undefined
            }
          >
            <div
              className={`flex items-center ${isCollapsed ? '' : 'space-x-3'} min-w-0 flex-1`}
            >
              <div
                className={`${isCollapsed ? 'w-8 h-8' : 'w-10 h-10'} bg-teal-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden`}
              >
                {activeAccount && activeAccount.profileImage ? (
                  <img
                    src={activeAccount.profileImage}
                    alt={activeAccount.username}
                    className="w-full h-full object-cover"
                  />
                ) : activeAccount?.platform === 'instagram' ? (
                  <Instagram
                    className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-white flex-shrink-0`}
                  />
                ) : activeAccount?.platform === 'youtube' ? (
                  <Youtube
                    className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-white flex-shrink-0`}
                  />
                ) : (
                  <Music
                    className={`${isCollapsed ? 'h-4 w-4' : 'h-5 w-5'} text-white flex-shrink-0`}
                  />
                )}
              </div>
              {!isCollapsed && (
                <div className="text-left min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {activeAccount
                      ? activeAccount.username
                      : 'No account selected'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {activeAccount ? activeAccount.platformData.name : ''}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-teal-500 flex-shrink-0" />
                    <p className="text-xs text-gray-600 truncate">
                      {activeAccount
                        ? `${activeAccount.platformData.followers} followers`
                        : 'Add an account'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showAccountDropdown ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {/* Account Dropdown */}
          {showAccountDropdown && !isCollapsed && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {userAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSwitch(account)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-all duration-200 ${
                      activeAccount && account.id === activeAccount.id
                        ? 'bg-teal-50 border-l-4 border-teal-500'
                        : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {account.profileImage ? (
                        <img
                          src={account.profileImage}
                          alt={account.username}
                          className="w-full h-full object-cover"
                        />
                      ) : account.platform === 'instagram' ? (
                        <Instagram className="h-4 w-4 text-white flex-shrink-0" />
                      ) : account.platform === 'youtube' ? (
                        <Youtube className="h-4 w-4 text-white flex-shrink-0" />
                      ) : (
                        <Music className="h-4 w-4 text-white flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {account.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {account.platformData.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {account.platformData.followers} followers
                      </p>
                    </div>
                    {activeAccount && account.id === activeAccount.id && (
                      <Star className="h-4 w-4 text-teal-500 fill-current flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100">
                <button
                  onClick={handleAddAccount}
                  className="w-full flex items-center space-x-3 p-3 text-teal-600 hover:bg-teal-50 transition-colors"
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Add Account</span>
                </button>
                {activeAccount && (
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setAccountToDisconnect(activeAccount);
                        setShowConfirmDisconnect(true);
                      }}
                      className="w-full flex items-center space-x-3 p-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>Disconnect active account</span>
                    </button>
                  </div>
                )}
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
              <div
                className="bg-teal-500 h-2 rounded-full"
                style={{ width: '65%' }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Actions */}
      <div
        className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-100 space-y-2`}
      >
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
      {/* Platform Selection Dialog (desktop) */}
      {showPlatformDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Connect Social Account
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose a platform to connect your account
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handlePlatformSelect('instagram')}
                className="w-full flex items-center space-x-3 p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
              >
                <Instagram className="h-5 w-5" />
                <span className="font-medium">Instagram</span>
              </button>

              <button
                onClick={() => handlePlatformSelect('youtube')}
                className="w-full flex items-center space-x-3 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
              >
                <Youtube className="h-5 w-5" />
                <span className="font-medium">YouTube</span>
              </button>

              <button
                onClick={() => handlePlatformSelect('tiktok')}
                className="w-full flex items-center space-x-3 p-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200"
              >
                <Music className="h-5 w-5" />
                <span className="font-medium">TikTok</span>
              </button>
            </div>

            <button
              onClick={() => setShowPlatformDialog(false)}
              className="w-full mt-4 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Confirm Disconnect Dialog */}
      <Dialog
        open={showConfirmDisconnect}
        onOpenChange={setShowConfirmDisconnect}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this account? This will remove
              the connection from your profile but will not delete any generated
              content.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                {accountToDisconnect?.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountToDisconnect.profileImage}
                    alt={accountToDisconnect.username}
                    className="w-full h-full object-cover"
                  />
                ) : accountToDisconnect?.platform === 'instagram' ? (
                  <Instagram className="h-5 w-5 text-gray-400" />
                ) : accountToDisconnect?.platform === 'youtube' ? (
                  <Youtube className="h-5 w-5 text-gray-400" />
                ) : (
                  <Music className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {accountToDisconnect?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {accountToDisconnect?.platformData.name}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowConfirmDisconnect(false)}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!accountToDisconnect) return;
                try {
                  const res = await fetch(
                    `/api/accounts/${accountToDisconnect.id}`,
                    { method: 'DELETE' }
                  );
                  if (res.ok) {
                    setUserAccounts((prev) =>
                      prev.filter((a) => a.id !== accountToDisconnect.id)
                    );
                    if (activeAccount?.id === accountToDisconnect.id) {
                      setActiveAccount(null);
                    }
                    setShowConfirmDisconnect(false);
                    setAccountToDisconnect(null);
                  } else {
                    // keep the dialog open and show a simple inline error
                    alert('Failed to disconnect account');
                  }
                } catch (err) {
                  console.error('Failed to disconnect account', err);
                  alert('Failed to disconnect account');
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md"
            >
              Disconnect
            </button>
          </DialogFooter>
          <DialogClose onClose={() => setShowConfirmDisconnect(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export type { SocialAccount };
