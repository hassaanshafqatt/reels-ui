'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Shield,
  ShieldOff,
  Loader,
  AlertCircle,
  CheckCircle,
  Crown,
  User,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserData | null;
    action: 'promote' | 'demote';
  }>({ open: false, user: null, action: 'promote' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${Cookies.get('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminToggle = async (user: UserData, newAdminStatus: boolean) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Cookies.get('auth_token')}`,
        },
        body: JSON.stringify({ is_admin: newAdminStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update admin status');
      }

      const data = await response.json();
      setSuccess(data.message);
      setConfirmDialog({ open: false, user: null, action: 'promote' });
      loadUsers(); // Reload users list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update admin status'
      );
      setConfirmDialog({ open: false, user: null, action: 'promote' });
    }
  };

  const openConfirmDialog = (user: UserData, action: 'promote' | 'demote') => {
    setConfirmDialog({ open: true, user, action });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage admin privileges for all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <span className="text-green-800 font-medium">{success}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-800 h-auto p-1 ml-auto"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <span className="text-red-800 font-medium">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 h-auto p-1 ml-auto"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.is_admin ? 'bg-teal-100' : 'bg-gray-100'
                    }`}
                  >
                    {user.is_admin ? (
                      <Crown className="h-5 w-5 text-teal-600" />
                    ) : (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      {user.is_admin && (
                        <Badge
                          variant="outline"
                          className="bg-teal-50 text-teal-700 border-teal-200"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {currentUser?.id === user.id && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={getPlanBadgeColor(user.plan)}
                      >
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Joined {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.is_admin ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog(user, 'demote')}
                      disabled={currentUser?.id === user.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <ShieldOff className="h-4 w-4 mr-1" />
                      Remove Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfirmDialog(user, 'promote')}
                      className="text-teal-600 border-teal-200 hover:bg-teal-50"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Make Admin
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({ open: false, user: null, action: 'promote' })
        }
      >
        <DialogContent className="p-8">
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {confirmDialog.action === 'promote' ? (
                <>
                  <Shield className="h-5 w-5 text-teal-600" />
                  Promote to Admin
                </>
              ) : (
                <>
                  <ShieldOff className="h-5 w-5 text-red-600" />
                  Remove Admin Access
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-base">
              {confirmDialog.action === 'promote' ? (
                <>
                  Are you sure you want to give{' '}
                  <strong>{confirmDialog.user?.name}</strong> administrator
                  privileges? This will allow them to access the admin panel and
                  manage other users.
                </>
              ) : (
                <>
                  Are you sure you want to remove administrator privileges from{' '}
                  <strong>{confirmDialog.user?.name}</strong>? They will no
                  longer be able to access the admin panel.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-4 pt-8 border-t border-gray-200 mt-8">
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, user: null, action: 'promote' })
              }
              className="h-12 px-6 text-base"
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog.action === 'promote' ? 'default' : 'outline'
              }
              className={`${confirmDialog.action === 'demote' ? 'bg-red-600 text-white hover:bg-red-700' : ''} h-12 px-6 text-base`}
              onClick={() => {
                if (confirmDialog.user) {
                  handleAdminToggle(
                    confirmDialog.user,
                    confirmDialog.action === 'promote'
                  );
                }
              }}
            >
              {confirmDialog.action === 'promote'
                ? 'Promote to Admin'
                : 'Remove Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
