import { Text, View } from "react-native";

type BalanceCardProps = {
  backgroundColor: string;
  moneyBalance: number;
  text: string;
};

export const BalanceCard = ({
  backgroundColor,
  moneyBalance,
  text,
}: BalanceCardProps) => {
  return (
    <View style={{ backgroundColor }} className="flex-1 rounded-2xl p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-1">
        {moneyBalance}
      </Text>
      <Text className="text-base font-medium text-gray-600">{text}</Text>
    </View>
  );
};
