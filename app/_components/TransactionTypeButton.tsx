import { PiggyBank, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react-native';
import type React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface TransactionTypeButtonProps {
  type: { id: string; name: string };
  isSelected: boolean;
  onPress: (id: string) => void;
}

interface TypeColors {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

const getTypeColor = (typeName: string): TypeColors => {
  switch (typeName.toLowerCase()) {
    case 'income':
      return {
        bg: 'bg-green-100',
        border: 'border-green-400',
        text: 'text-green-600',
        icon: '#16A34A',
      };
    case 'expense':
      return {
        bg: 'bg-red-100',
        border: 'border-red-400',
        text: 'text-red-600',
        icon: '#DC2626',
      };
    case 'compensation':
      return {
        bg: 'bg-blue-100',
        border: 'border-blue-400',
        text: 'text-blue-600',
        icon: '#2563EB',
      };
    case 'savings':
      return {
        bg: 'bg-purple-100',
        border: 'border-purple-400',
        text: 'text-purple-600',
        icon: '#7C3AED',
      };
    default:
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-600',
        icon: '#6B7280',
      };
  }
};

const getTypeIcon = (typeName: string, isSelected: boolean, colors: TypeColors) => {
  const iconColor = isSelected ? colors.icon : '#6B7280';

  switch (typeName.toLowerCase()) {
    case 'income':
      return <TrendingUp size={18} color={iconColor} />;
    case 'expense':
      return <TrendingDown size={18} color={iconColor} />;
    case 'compensation':
      return <RefreshCw size={18} color={iconColor} />;
    case 'savings':
      return <PiggyBank size={18} color={iconColor} />;
    default:
      return null;
  }
};

const TransactionTypeButton: React.FC<TransactionTypeButtonProps> = ({
  type,
  isSelected,
  onPress,
}) => {
  const colors = getTypeColor(type.name);

  return (
    <TouchableOpacity
      onPress={() => onPress(type.id)}
      className={`py-3 px-2 rounded-xl flex-row items-center justify-center mb-2 border-2 ${
        isSelected ? `${colors.bg} ${colors.border}` : 'bg-gray-100 border-gray-200'
      }`}
      style={{ width: '48%', minWidth: 120 }}
    >
      {getTypeIcon(type.name, isSelected, colors)}
      <Text
        className={`ml-1 font-semibold text-sm ${isSelected ? colors.text : 'text-gray-600'}`}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {type.name}
      </Text>
    </TouchableOpacity>
  );
};

export default TransactionTypeButton;
export { TransactionTypeButton };
