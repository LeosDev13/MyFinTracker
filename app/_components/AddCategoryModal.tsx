import { Palette, X } from 'lucide-react-native';
import type React from 'react';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ColorPicker from './ColorPicker';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
}

const CATEGORY_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Purple
  '#98D8C8', // Mint
  '#2E7D32', // Dark Green
  '#FF8A65', // Orange
  '#BA68C8', // Light Purple
  '#4FC3F7', // Light Blue
  '#81C784', // Light Green
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ visible, onClose, onSubmit }) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSubmit = () => {
    if (categoryName.trim()) {
      onSubmit(categoryName.trim(), selectedColor);
      setCategoryName('');
      setSelectedColor(CATEGORY_COLORS[0]);
      onClose();
    }
  };

  const handleClose = () => {
    setCategoryName('');
    setSelectedColor(CATEGORY_COLORS[0]);
    setShowColorPicker(false);
    onClose();
  };

  const handleCustomColor = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 min-h-[400px]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">Add New Category</Text>
              <TouchableOpacity onPress={handleClose} className="p-2 -mr-2">
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Category Name Input */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">Category Name</Text>
              <TextInput
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
                className="border border-gray-300 rounded-xl px-4 py-3 text-base bg-white"
                autoFocus={true}
                maxLength={30}
              />
            </View>

            {/* Color Selection */}
            <View className="mb-8">
              <Text className="text-base font-medium text-gray-700 mb-3">Choose Color</Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORY_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-full border-4 ${
                      selectedColor === color ? 'border-gray-900' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}

                {/* Custom Color Picker Button */}
                <TouchableOpacity
                  onPress={() => setShowColorPicker(true)}
                  className={`w-12 h-12 rounded-full border-4 border-dashed border-gray-400 bg-gray-100 items-center justify-center ${
                    !CATEGORY_COLORS.includes(selectedColor) ? 'border-gray-900 border-solid' : ''
                  }`}
                >
                  <Palette size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Show selected custom color */}
              {!CATEGORY_COLORS.includes(selectedColor) && (
                <View className="mt-3 flex-row items-center">
                  <View
                    className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Text className="text-sm text-gray-600">Custom color: {selectedColor}</Text>
                </View>
              )}
            </View>

            {/* Preview */}
            <View className="mb-6">
              <Text className="text-base font-medium text-gray-700 mb-2">Preview</Text>
              <View className="flex-row items-center p-4 bg-gray-50 rounded-xl">
                <View
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: selectedColor }}
                />
                <Text className="text-base font-medium text-gray-900">
                  {categoryName || 'Category Name'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleClose}
                className="flex-1 py-4 rounded-xl border border-gray-300"
              >
                <Text className="text-center text-base font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!categoryName.trim()}
                className={`flex-1 py-4 rounded-xl ${
                  categoryName.trim() ? 'bg-[#1F5F43]' : 'bg-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-base font-medium ${
                    categoryName.trim() ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Add Category
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ColorPicker
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onColorSelect={handleCustomColor}
      />
    </Modal>
  );
};

export default AddCategoryModal;
export { AddCategoryModal };
