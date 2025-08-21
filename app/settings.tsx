import { router } from 'expo-router';
import { ArrowLeft, Plus, Settings, Trash2, Grid3X3 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../src/context';
import AddCategoryModal from './_components/AddCategoryModal';
import MemoryStatsViewer from './_components/MemoryStatsViewer';
import Toast from './_components/Toast';

const SettingsScreen = () => {
  const { state: appState, addCategory, deleteCategory } = useApp();
  const { state: settingsState, updateSetting } = useSettings();

  const { currencies, categories, loading } = appState;
  const { defaultCurrency } = settingsState.settings;

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const handleCurrencySelect = async (currencyId: string) => {
    try {
      await updateSetting('defaultCurrency', currencyId);
      const currency = currencies.find((c) => c.id === currencyId);
      setToast({
        visible: true,
        message: `Default currency set to ${currency?.name} (${currency?.symbol}). All amounts will now display in this currency.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      setToast({
        visible: true,
        message: 'Failed to update default currency',
        type: 'error',
      });
    }
  };

  const handleAddCategory = async (name: string, color: string) => {
    try {
      await addCategory(name, color);
      setToast({
        visible: true,
        message: `Category "${name}" added successfully`,
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to add category:', error);
      setToast({
        visible: true,
        message: 'Failed to add category',
        type: 'error',
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              setToast({
                visible: true,
                message: `Category "${categoryName}" deleted successfully`,
                type: 'success',
              });
            } catch (error) {
              console.error('Failed to delete category:', error);
              const errorMessage =
                error instanceof Error ? error.message : 'Failed to delete category';
              setToast({
                visible: true,
                message: errorMessage,
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  if (loading.categories || loading.currencies || settingsState.loading) {
    return (
      <View className="flex-1 bg-soft-pink justify-center items-center">
        <Text className="text-lg text-gray-600">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-soft-pink">
      <StatusBar barStyle="dark-content" className="bg-soft-pink" />

      {/* Header */}
      <View className="px-6 pt-14 pb-5 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
          <ArrowLeft size={24} color="#1C2B2E" />
        </TouchableOpacity>
        <Settings size={28} color="#1C2B2E" className="mr-3" />
        <Text className="text-3xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Default Currency Section */}
        <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Default Currency</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Select your preferred currency for new transactions
          </Text>

          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency.id}
              onPress={() => handleCurrencySelect(currency.id)}
              className={`flex-row items-center justify-between p-4 rounded-lg mb-2 border ${
                defaultCurrency === currency.id
                  ? 'bg-[#C4D7C0] border-[#1F5F43]'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{currency.symbol}</Text>
                <View>
                  <Text
                    className={`text-base font-medium ${
                      defaultCurrency === currency.id ? 'text-[#1F5F43]' : 'text-gray-900'
                    }`}
                  >
                    {currency.name}
                  </Text>
                  <Text
                    className={`text-sm ${
                      defaultCurrency === currency.id ? 'text-[#1F5F43]' : 'text-gray-500'
                    }`}
                  >
                    {currency.code}
                  </Text>
                </View>
              </View>
              {defaultCurrency === currency.id && (
                <View className="w-3 h-3 rounded-full bg-[#1F5F43]" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Widget Management Section */}
        <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">Dashboard</Text>
          <TouchableOpacity
            onPress={() => router.push('/widgetManagement')}
            className="flex-row items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 bg-[#1F5F43] rounded-full items-center justify-center mr-3">
                <Grid3X3 size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Widget Management</Text>
                <Text className="text-sm text-gray-600 mt-0.5">
                  Customize your dashboard widgets
                </Text>
              </View>
            </View>
            <ArrowLeft size={16} color="#6B7280" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Categories</Text>
            <TouchableOpacity
              onPress={() => setShowAddCategoryModal(true)}
              className="flex-row items-center bg-[#1F5F43] px-3 py-2 rounded-lg"
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-medium ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-gray-600 mb-4">
            Manage expense and income categories for your transactions
          </Text>

          {categories.map((category) => (
            <View
              key={category.id}
              className="flex-row items-center justify-between p-4 rounded-lg mb-2 bg-gray-50 border border-gray-200"
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: category.color }}
                />
                <Text className="text-base font-medium text-gray-900 flex-1">{category.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCategory(category.id, category.name)}
                className="ml-3 p-2"
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Memory Stats (Development Only) */}
        <MemoryStatsViewer />

        {/* App Info Section */}
        <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">About</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Version</Text>
              <Text className="text-gray-900 font-medium">1.0.0</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Database</Text>
              <Text className="text-gray-900 font-medium">SQLite (Local)</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Storage</Text>
              <Text className="text-gray-900 font-medium">100% Offline</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddCategoryModal
        visible={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onSubmit={handleAddCategory}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

export default SettingsScreen;
