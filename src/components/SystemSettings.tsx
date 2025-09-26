import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, AlertCircle, Settings, Type, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSetting {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}

export function SystemSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get global polling setting
  const pollingEnabled =
    settings.find((s) => s.key === 'global_polling_enabled')?.value === 'true';
  const defaultMinCaptionLength = parseInt(
    settings.find((s) => s.key === 'default_min_caption_length')?.value || '10'
  );
  const defaultMaxCaptionLength = parseInt(
    settings.find((s) => s.key === 'default_max_caption_length')?.value || '100'
  );
  const includeAuthorByDefault =
    settings.find((s) => s.key === 'include_author_by_default')?.value ===
    'true';
  const allowCustomAudioGlobally =
    settings.find((s) => s.key === 'allow_custom_audio_globally')?.value ===
    'true';
  // UI label settings (provide defaults if missing)
  const captionTitleLabel =
    settings.find((s) => s.key === 'label_caption_title')?.value ||
    'Custom Caption';
  const captionDescriptionLabel =
    settings.find((s) => s.key === 'label_caption_description')?.value ||
    'Write your own caption for the reel. This will override the AI-generated caption.';
  const captionFieldLabel =
    settings.find((s) => s.key === 'label_caption_field')?.value || 'Caption';
  const captionPlaceholderLabel =
    settings.find((s) => s.key === 'label_caption_placeholder')?.value || '';
  const captionToggleAutoLabel =
    settings.find((s) => s.key === 'label_caption_toggle_auto')?.value ||
    'Auto-Generate';
  const captionToggleAutoSub =
    settings.find((s) => s.key === 'label_caption_toggle_auto_sub')?.value ||
    'AI creates caption';
  const captionToggleCustomLabel =
    settings.find((s) => s.key === 'label_caption_toggle_custom')?.value ||
    'Custom Caption';
  const captionToggleCustomSub =
    settings.find((s) => s.key === 'label_caption_toggle_custom_sub')?.value ||
    'Write your own';

  const fetchSettings = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch('/api/admin/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data.settings || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateSetting = async (
    key: string,
    value: string,
    description?: string
  ) => {
    if (!token) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      const data = await response.json();

      // Update the settings state
      setSettings((prev) =>
        prev.map((setting) =>
          setting.key === key
            ? { ...setting, value, updated_at: data.setting.updated_at }
            : setting
        )
      );

      setSuccess(`Setting updated successfully`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handlePollingToggle = (enabled: boolean) => {
    updateSetting(
      'global_polling_enabled',
      enabled.toString(),
      'Enable or disable global job status polling'
    );
  };

  const handleMinCaptionLengthChange = (length: string) => {
    const numLength = parseInt(length);
    if (!isNaN(numLength) && numLength > 0 && numLength <= 1000) {
      // Ensure min is not greater than max
      if (numLength <= defaultMaxCaptionLength) {
        updateSetting(
          'default_min_caption_length',
          numLength.toString(),
          'Default minimum length for reel captions in characters'
        );
      }
    }
  };

  const handleMaxCaptionLengthChange = (length: string) => {
    const numLength = parseInt(length);
    if (!isNaN(numLength) && numLength > 0 && numLength <= 1000) {
      // Ensure max is not less than min
      if (numLength >= defaultMinCaptionLength) {
        updateSetting(
          'default_max_caption_length',
          numLength.toString(),
          'Default maximum length for reel captions in characters'
        );
      }
    }
  };

  const handleAuthorToggle = (enabled: boolean) => {
    updateSetting(
      'include_author_by_default',
      enabled.toString(),
      'Whether to include author information in reels by default'
    );
  };

  const handleAllowCustomAudioToggle = (enabled: boolean) => {
    updateSetting(
      'allow_custom_audio_globally',
      enabled.toString(),
      'If false, disables custom audio uploads for all reel types'
    );
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-teal-100 rounded-full">
            <Loader className="h-6 w-6 animate-spin text-teal-600" />
          </div>
          <span className="text-base text-gray-600 font-medium">
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-green-100 rounded-full">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-red-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Polling Control */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <Label
                htmlFor="polling-toggle"
                className="text-xl font-bold text-gray-900"
              >
                Global Job Polling
              </Label>
            </div>
            <p className="text-base text-gray-600 leading-relaxed">
              Enable or disable automatic polling for job status updates across
              the entire system. When disabled, jobs will not be automatically
              checked for status changes.
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <span className="font-medium">Status:</span>
              <span
                className={`font-bold ml-1 ${pollingEnabled ? 'text-green-600' : 'text-red-600'}`}
              >
                {pollingEnabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
              {settings.find((s) => s.key === 'global_polling_enabled') && (
                <span className="block mt-1 text-xs">
                  Last updated:{' '}
                  {new Date(
                    settings.find(
                      (s) => s.key === 'global_polling_enabled'
                    )!.updated_at
                  ).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saving && (
              <div className="flex items-center gap-2 text-teal-600">
                <Loader className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
            )}
            <Switch
              id="polling-toggle"
              checked={pollingEnabled}
              onCheckedChange={handlePollingToggle}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Caption Length Control */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Type className="h-5 w-5 text-white" />
            </div>
            <Label className="text-xl font-bold text-gray-900">
              Default Caption Length Range
            </Label>
          </div>
          <p className="text-base text-gray-600 leading-relaxed">
            Set the default minimum and maximum length for reel captions in
            characters. These will be applied to new reel types but can be
            overridden per reel type.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Minimum Caption Length */}
            <div className="space-y-3">
              <Label
                htmlFor="min-caption-length"
                className="text-base font-semibold text-gray-800"
              >
                Minimum Length
              </Label>
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Current minimum:</span>
                <span className="font-bold ml-1 text-blue-600">
                  {defaultMinCaptionLength} characters
                </span>
                {settings.find(
                  (s) => s.key === 'default_min_caption_length'
                ) && (
                  <span className="block mt-1 text-xs">
                    Last updated:{' '}
                    {new Date(
                      settings.find(
                        (s) => s.key === 'default_min_caption_length'
                      )!.updated_at
                    ).toLocaleString()}
                  </span>
                )}
              </div>
              <Input
                id="min-caption-length"
                type="number"
                min="1"
                max="1000"
                value={defaultMinCaptionLength}
                onChange={(e) => handleMinCaptionLengthChange(e.target.value)}
                disabled={saving}
                className="w-full"
              />
            </div>

            {/* Maximum Caption Length */}
            <div className="space-y-3">
              <Label
                htmlFor="max-caption-length"
                className="text-base font-semibold text-gray-800"
              >
                Maximum Length
              </Label>
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                <span className="font-medium">Current maximum:</span>
                <span className="font-bold ml-1 text-blue-600">
                  {defaultMaxCaptionLength} characters
                </span>
                {settings.find(
                  (s) => s.key === 'default_max_caption_length'
                ) && (
                  <span className="block mt-1 text-xs">
                    Last updated:{' '}
                    {new Date(
                      settings.find(
                        (s) => s.key === 'default_max_caption_length'
                      )!.updated_at
                    ).toLocaleString()}
                  </span>
                )}
              </div>
              <Input
                id="max-caption-length"
                type="number"
                min="1"
                max="1000"
                value={defaultMaxCaptionLength}
                onChange={(e) => handleMaxCaptionLengthChange(e.target.value)}
                disabled={saving}
                className="w-full"
              />
            </div>
          </div>

          {/* Caption Label Customization */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Type className="h-5 w-5 text-white" />
                </div>
                <Label className="text-xl font-bold text-gray-900">
                  Caption UI Labels
                </Label>
              </div>

              <p className="text-base text-gray-600">
                Customize the UI text for caption-related buttons and fields
                shown to users during generation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Dialog Title</Label>
                  <Input
                    value={captionTitleLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_title',
                        e.target.value,
                        'UI label: Custom caption dialog title'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Dialog Description
                  </Label>
                  <Input
                    value={captionDescriptionLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_description',
                        e.target.value,
                        'UI label: Custom caption dialog description'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Field Label</Label>
                  <Input
                    value={captionFieldLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_field',
                        e.target.value,
                        'UI label: Caption field label'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Placeholder</Label>
                  <Input
                    value={captionPlaceholderLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_placeholder',
                        e.target.value,
                        'UI label: Caption field placeholder'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Toggle - Auto Label
                  </Label>
                  <Input
                    value={captionToggleAutoLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_toggle_auto',
                        e.target.value,
                        'UI label: Caption toggle auto label'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Toggle - Auto Subtext
                  </Label>
                  <Input
                    value={captionToggleAutoSub}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_toggle_auto_sub',
                        e.target.value,
                        'UI label: Caption toggle auto subtext'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Toggle - Custom Label
                  </Label>
                  <Input
                    value={captionToggleCustomLabel}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_toggle_custom',
                        e.target.value,
                        'UI label: Caption toggle custom label'
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Toggle - Custom Subtext
                  </Label>
                  <Input
                    value={captionToggleCustomSub}
                    onChange={(e) =>
                      updateSetting(
                        'label_caption_toggle_custom_sub',
                        e.target.value,
                        'UI label: Caption toggle custom subtext'
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {defaultMinCaptionLength >= defaultMaxCaptionLength && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ Warning: Minimum length should be less than maximum length
                for proper validation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Author Field Control */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <Label
                htmlFor="author-toggle"
                className="text-xl font-bold text-gray-900"
              >
                Include Author by Default
              </Label>
            </div>
            <p className="text-base text-gray-600 leading-relaxed">
              Determine whether author information should be included in reels
              by default. This setting applies to new reel types but can be
              customized for each reel type individually.
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <span className="font-medium">Status:</span>
              <span
                className={`font-bold ml-1 ${includeAuthorByDefault ? 'text-green-600' : 'text-red-600'}`}
              >
                {includeAuthorByDefault ? '✓ Include Author' : '✗ No Author'}
              </span>
              {settings.find((s) => s.key === 'include_author_by_default') && (
                <span className="block mt-1 text-xs">
                  Last updated:{' '}
                  {new Date(
                    settings.find(
                      (s) => s.key === 'include_author_by_default'
                    )!.updated_at
                  ).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Switch
              id="author-toggle"
              checked={includeAuthorByDefault}
              onCheckedChange={handleAuthorToggle}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Custom Audio Global Control */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <Label
                htmlFor="custom-audio-toggle"
                className="text-xl font-bold text-gray-900"
              >
                Allow Custom Audio (Global)
              </Label>
            </div>
            <p className="text-base text-gray-600 leading-relaxed">
              Enable or disable custom audio uploads across the entire system.
              When disabled, users cannot select or upload custom audio for any
              reel type.
            </p>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <span className="font-medium">Status:</span>
              <span
                className={`font-bold ml-1 ${allowCustomAudioGlobally ? 'text-green-600' : 'text-red-600'}`}
              >
                {allowCustomAudioGlobally ? '✓ Enabled' : '✗ Disabled'}
              </span>
              {settings.find(
                (s) => s.key === 'allow_custom_audio_globally'
              ) && (
                <span className="block mt-1 text-xs">
                  Last updated:{' '}
                  {new Date(
                    settings.find(
                      (s) => s.key === 'allow_custom_audio_globally'
                    )!.updated_at
                  ).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saving && (
              <div className="flex items-center gap-2 text-teal-600">
                <Loader className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Saving...</span>
              </div>
            )}
            <Switch
              id="custom-audio-toggle"
              checked={allowCustomAudioGlobally}
              onCheckedChange={handleAllowCustomAudioToggle}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Additional Settings Placeholder */}
      <div className="border-t border-gradient-to-r from-gray-200 via-gray-100 to-gray-200 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              System Information
            </h3>
            <p className="text-base text-gray-500">
              Settings are automatically saved and take effect immediately
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="hover:bg-gray-50 transition-colors border-gray-300 text-gray-700 hover:border-gray-400 rounded-lg px-4 py-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Refresh Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
