import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp, useSettings } from '../src/context';
import { Database, type Transaction } from '../src/db/database';
import { CompensationSelector } from './_components/CompensationSelector';
import { Toast } from './_components/Toast';
import { TransactionTypeButton } from './_components/TransactionTypeButton';

const NewTransactionScreen = () => {
  const { state, addTransaction } = useApp();
  const { state: settingsState } = useSettings();

  const { transactionTypes, categories, currencies } = state;
  const { defaultCurrency, defaultTransactionType, defaultCategory } = settingsState.settings;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedType, setSelectedType] = useState<string>(defaultTransactionType);
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const [compensatableTransactions, setCompensatableTransactions] = useState<Transaction[]>([]);
  const [selectedCompensatedTransaction, setSelectedCompensatedTransaction] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadCompensatableTransactions = useCallback(async () => {
    try {
      const transactions = await Database.getCompensatableTransactions();
      setCompensatableTransactions(transactions);
    } catch (error) {
      console.error('Failed to load compensatable transactions:', error);
      setToast({
        visible: true,
        message: 'Failed to load transactions',
        type: 'error',
      });
    }
  }, []);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const defaultCat = categories.find((c) => c.id === defaultCategory) || categories[0];
      setSelectedCategory(defaultCat.id);
    }
  }, [categories, selectedCategory, defaultCategory]);

  useEffect(() => {
    if (selectedType === 'compensation') {
      loadCompensatableTransactions();
    }
  }, [selectedType, loadCompensatableTransactions]);

  const handleSave = async () => {
    const amountNumber = parseFloat(amount);
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setToast({
        visible: true,
        message: 'Please enter a valid amount greater than 0.',
        type: 'error',
      });
      return;
    }

    if (!selectedCategory) {
      setToast({
        visible: true,
        message: 'Please select a category.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    const newTransaction: Omit<Transaction, 'id'> = {
      type_id: selectedType,
      category_id: selectedCategory,
      currency_id: selectedCurrency,
      amount: amountNumber,
      date: date,
      settlement_id: null,
      recurrence_id: null,
      note: note || 'Transaction', // Default note if empty
    };

    try {
      const transactionId = await addTransaction(newTransaction);

      // If this is a compensation transaction and a compensated transaction was selected
      if (selectedType === 'compensation' && selectedCompensatedTransaction) {
        await Database.addSettlement({
          compensated_transaction_id: selectedCompensatedTransaction,
          compensation_transaction_id: transactionId,
          amount: amountNumber,
        });
      }

      setToast({
        visible: true,
        message: 'Transaction saved successfully!',
        type: 'success',
      });

      // Delay navigation to show the success toast
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      setToast({
        visible: true,
        message: 'Failed to save transaction. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCurrencyData = currencies.find((c) => c.id === selectedCurrency);

  return (
    <View className="flex-1 bg-soft-pink">
      <StatusBar barStyle="dark-content" className="bg-soft-pink" />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View className="px-6 pt-14 pb-5 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 p-2 rounded-full bg-white/20"
        >
          <ArrowLeft size={20} color="#1C2B2E" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#1C2B2E]">New Transaction</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card - Essential Fields */}
        <View className="mx-6 mb-6 bg-white rounded-xl p-6 shadow-sm">
          {/* Amount Input - Prominente */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-[#1C2B2E] mb-3 text-center">Amount</Text>
            <View className="flex-row items-center justify-center">
              <Text className="text-4xl font-bold text-[#1C2B2E] mr-2">
                {selectedCurrencyData?.symbol || '$'}
              </Text>
              <TextInput
                className="text-4xl font-bold text-[#1C2B2E] min-w-[120px] text-center"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                autoFocus
              />
            </View>
          </View>

          {/* Type Selection - Todos los tipos */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-[#1C2B2E] mb-3">Type</Text>
            <View className="flex-row flex-wrap justify-between">
              {transactionTypes.map((type) => (
                <TransactionTypeButton
                  key={type.id}
                  type={type}
                  isSelected={selectedType === type.id}
                  onPress={setSelectedType}
                />
              ))}
            </View>
          </View>

          {/* Category Selector - Dropdown */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-[#1C2B2E] mb-3">Category</Text>
            <TouchableOpacity
              onPress={() => setShowCategorySelector(!showCategorySelector)}
              className="border-2 border-gray-300 rounded-lg p-4 flex-row items-center justify-between bg-white"
            >
              <View className="flex-row items-center">
                {selectedCategory && (
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{
                      backgroundColor:
                        categories.find((c) => c.id === selectedCategory)?.color || '#gray',
                    }}
                  />
                )}
                <Text className="text-base text-[#1C2B2E] font-medium">
                  {selectedCategory
                    ? categories.find((c) => c.id === selectedCategory)?.name || 'Select category'
                    : 'Select category'}
                </Text>
              </View>
              <ChevronDown size={20} color="#6B7280" />
            </TouchableOpacity>

            {showCategorySelector && (
              <View className="border border-gray-200 rounded-lg mt-2 bg-white max-h-48">
                <View>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setShowCategorySelector(false);
                      }}
                      className={`p-4 border-b border-gray-100 flex-row items-center ${
                        selectedCategory === category.id ? 'bg-[#C4D7C0]' : 'bg-white'
                      }`}
                    >
                      <View
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: category.color }}
                      />
                      <Text
                        className={`text-base font-medium ${
                          selectedCategory === category.id ? 'text-[#1F5F43]' : 'text-gray-700'
                        }`}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Compensation Selector - Show when compensation type is selected */}
            {selectedType === 'compensation' && (
              <CompensationSelector
                transactions={compensatableTransactions}
                selectedTransactionId={selectedCompensatedTransaction}
                onSelect={setSelectedCompensatedTransaction}
              />
            )}
          </View>
        </View>

        {/* Optional Note - Simple */}
        <View className="mx-6 mb-4 bg-white rounded-xl p-4 shadow-sm">
          <TextInput
            className="text-base text-[#1C2B2E] p-2"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)..."
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            maxLength={100}
          />
        </View>

        {/* Advanced Options - Collapsible */}
        <View className="mx-6 mb-6">
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-base font-medium text-gray-700">Advanced Options</Text>
            {showAdvanced ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </TouchableOpacity>

          {showAdvanced && (
            <View className="bg-white rounded-xl mt-2 p-4 shadow-sm">
              {/* Date */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Date</Text>
                <TextInput
                  className="text-base text-[#1C2B2E] border border-gray-300 rounded-lg p-3"
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Currency */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Currency</Text>
                <View className="flex-row flex-wrap gap-2">
                  {currencies.map((currency) => (
                    <TouchableOpacity
                      key={currency.id}
                      onPress={() => setSelectedCurrency(currency.id)}
                      className={`px-4 py-3 rounded-lg border mb-2 min-w-[80px] ${
                        selectedCurrency === currency.id
                          ? 'border-[#1F5F43] bg-[#C4D7C0]'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium text-center ${
                          selectedCurrency === currency.id ? 'text-[#1F5F43]' : 'text-gray-600'
                        }`}
                        numberOfLines={1}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.8}
                      >
                        {currency.symbol} {currency.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-soft-pink pb-24 pt-4 px-6">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className={`rounded-xl py-4 px-6 shadow-lg ${isLoading ? 'bg-gray-400' : 'bg-[#1F5F43]'}`}
        >
          <Text className="text-white text-lg font-bold text-center">
            {isLoading ? 'Saving...' : 'Save Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NewTransactionScreen;
