import React from 'react';
import { Text, View } from 'react-native';
import { useSettings } from '../../src/context';

type BalanceCardProps = {
  backgroundColor: string;
  moneyBalance: number;
  text: string;
};

const BalanceCard = React.memo(({ backgroundColor, moneyBalance, text }: BalanceCardProps) => {
  const { getFormattedCurrency } = useSettings();

  return (
    <View style={{ backgroundColor }} className="flex-1 rounded-2xl p-4 min-w-0">
      <Text
        className="text-2xl font-bold text-gray-900 mb-1"
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.7}
      >
        {getFormattedCurrency(moneyBalance)}
      </Text>
      <Text className="text-base font-medium text-gray-600" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

export default BalanceCard;
export { BalanceCard };
