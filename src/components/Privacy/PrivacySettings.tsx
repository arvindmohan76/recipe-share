import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { useAuth } from '../../context/AuthContext';
import {
  getUserPrivacySettings,
  updatePrivacySettings,
  clearSearchHistory,
  getUserSearchHistory,
  PrivacySettings as PrivacySettingsType
} from '../../lib/searchHistory';

const PrivacySettings: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [searchHistoryCount, setSearchHistoryCount] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
      loadSearchHistoryCount();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;

    try {
      const userSettings = await getUserPrivacySettings(user.id);
      if (userSettings) {
        setSettings(userSettings);
      } else {
        // Create default settings
        const defaultSettings: Partial<PrivacySettingsType> = {
          allow_search_history: true,
          allow_personalized_recommendations: true,
          allow_analytics: false,
          data_retention_days: 365
        };
        await updatePrivacySettings(user.id, defaultSettings);
        setSettings({
          user_id: user.id,
          ...defaultSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as PrivacySettingsType);
      }
    } catch (err) {
      console.error('Failed to load privacy settings:', err);
      setMessage('Failed to load privacy settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistoryCount = async () => {
    if (!user) return;

    try {
      const history = await getUserSearchHistory(user.id, 1000);
      setSearchHistoryCount(history.length);
    } catch (err) {
      console.error('Failed to load search history count:', err);
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !settings) return;

    setSaving(true);
    try {
      const success = await updatePrivacySettings(user.id, {
        allow_search_history: settings.allow_search_history,
        allow_personalized_recommendations: settings.allow_personalized_recommendations,
        allow_analytics: settings.allow_analytics,
        data_retention_days: settings.data_retention_days
      });

      if (success) {
        setMessage('Privacy settings updated successfully');
        setMessageType('success');
      } else {
        setMessage('Failed to update privacy settings');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('An error occurred while updating settings');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearSearchHistory = async () => {
    if (!user) return;

    try {
      const success = await clearSearchHistory(user.id);
      if (success) {
        setSearchHistoryCount(0);
        setMessage('Search history cleared successfully');
        setMessageType('success');
      } else {
        setMessage('Failed to clear search history');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('An error occurred while clearing search history');
      setMessageType('error');
    } finally {
      setShowClearDialog(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettingsType, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (!settings) {
    return (
      <Message severity="error" text="Failed to load privacy settings" className="w-full" />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Privacy Settings</h1>
        <Button
          label="Save Changes"
          icon="pi pi-save"
          onClick={handleSaveSettings}
          loading={saving}
          className="p-button-success"
        />
      </div>

      {message && (
        <Message 
          severity={messageType} 
          text={message} 
          className="w-full"
          onRemove={() => setMessage('')}
        />
      )}

      {/* Search History Settings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Search History</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              inputId="allow-search-history"
              checked={settings.allow_search_history}
              onChange={(e) => updateSetting('allow_search_history', e.checked)}
            />
            <label htmlFor="allow-search-history" className="font-medium">
              Allow search history tracking
            </label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            When enabled, we'll save your search queries to provide better search suggestions and personalized recommendations.
            You currently have {searchHistoryCount} search entries.
          </p>

          {settings.allow_search_history && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center gap-3">
                <label htmlFor="retention-days" className="font-medium">
                  Keep search history for:
                </label>
                <InputNumber
                  id="retention-days"
                  value={settings.data_retention_days}
                  onValueChange={(e) => updateSetting('data_retention_days', e.value || 365)}
                  min={30}
                  max={1095}
                  suffix=" days"
                  className="w-32"
                />
              </div>
              <p className="text-xs text-gray-500">
                Search history older than this will be automatically deleted (30-1095 days)
              </p>
            </div>
          )}

          <Divider />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-700">Clear Search History</h4>
              <p className="text-sm text-gray-600">
                Permanently delete all your search history data
              </p>
            </div>
            <Button
              label="Clear History"
              icon="pi pi-trash"
              onClick={() => setShowClearDialog(true)}
              className="p-button-danger p-button-outlined"
              disabled={searchHistoryCount === 0}
            />
          </div>
        </div>
      </Card>

      {/* Recommendations Settings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Personalized Recommendations</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              inputId="allow-recommendations"
              checked={settings.allow_personalized_recommendations}
              onChange={(e) => updateSetting('allow_personalized_recommendations', e.checked)}
            />
            <label htmlFor="allow-recommendations" className="font-medium">
              Enable personalized recipe recommendations
            </label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            When enabled, we'll analyze your search history, saved recipes, and preferences to suggest recipes you might like.
          </p>
        </div>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Analytics & Insights</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              inputId="allow-analytics"
              checked={settings.allow_analytics}
              onChange={(e) => updateSetting('allow_analytics', e.checked)}
            />
            <label htmlFor="allow-analytics" className="font-medium">
              Enable personal analytics dashboard
            </label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            When enabled, you'll see insights about your cooking preferences, search patterns, and recipe discovery trends.
          </p>
        </div>
      </Card>

      {/* Data Rights */}
      <Card>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Data Rights</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>• <strong>Right to Access:</strong> You can view all your data through your profile and settings.</p>
          <p>• <strong>Right to Rectification:</strong> You can edit or correct your data at any time.</p>
          <p>• <strong>Right to Erasure:</strong> You can delete your search history and other data.</p>
          <p>• <strong>Right to Portability:</strong> Contact us to export your data in a portable format.</p>
          <p>• <strong>Right to Object:</strong> You can opt out of any data processing at any time.</p>
        </div>
      </Card>

      {/* Clear History Confirmation Dialog */}
      <Dialog
        header="Clear Search History"
        visible={showClearDialog}
        onHide={() => setShowClearDialog(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              onClick={() => setShowClearDialog(false)}
              className="p-button-secondary"
            />
            <Button
              label="Clear History"
              onClick={handleClearSearchHistory}
              className="p-button-outlined p-button-danger"
            />
          </div>
        }
      >
        <div className="space-y-3">
          <p>Are you sure you want to clear all your search history?</p>
          <p className="text-sm text-gray-600">
            This action cannot be undone. Clearing your search history will also affect your personalized recommendations.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You currently have {searchHistoryCount} search entries that will be permanently deleted.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PrivacySettings;