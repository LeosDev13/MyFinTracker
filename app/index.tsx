import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle, G } from "react-native-svg";
import { BalanceCard } from "./_components/balanceCard";
import { useRouter } from "expo-router";


const screenWidth = Dimensions.get("window").width;

const DashboardScreen = () => {
  const router = useRouter();

  const lineData = {
    labels: ["1", "5", "10", "15", "20", "25"],
    datasets: [
      {
        data: [1950, 2100, 1800, 2600, 2200, 2450],
        color: (opacity = 1) => `rgba(34, 97, 64, ${opacity})`, // Verde del gráfico
        strokeWidth: 2.5,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(34, 97, 64, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "3.5",
      strokeWidth: "2",
      stroke: "#226140",
      fill: "#226140",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#E5E7EB",
      strokeWidth: 0.8,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: "400",
      color: "#374151",
    },
    propsForVerticalLabels: {
      fontSize: 11,
      fontWeight: "400",
      color: "#374151",
    },
  };

  const DonutChart = () => {
    const size = 140;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const data = [
      { percentage: 42, color: "#226140", label: "Alimentación" }, // Verde oscuro principal
      { percentage: 28, color: "#9BC5A2", label: "Transporte" }, // Verde claro
      { percentage: 18, color: "#D4A5A5", label: "Ocio" }, // Rosa/salmón claro
      { percentage: 12, color: "#E8DDD4", label: "Otros" }, // Beige muy claro
    ];

    let cumulativePercentage = 0;

    return (
      <View className="items-center flex-row">
        <View className="flex-1">
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
              {data.map((item, index) => {
                const strokeDasharray = `${(circumference * item.percentage) / 100} ${circumference}`;
                const strokeDashoffset = -(
                  (circumference * cumulativePercentage) /
                  100
                );
                cumulativePercentage += item.percentage;

                return (
                  <Circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                  />
                );
              })}
            </G>
          </Svg>
        </View>

        <View className="mt-5 ml-8">
          {data.map((item, index) => (
            <View key={index} className="flex-row items-center mb-2">
              <View
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: item.color }}
              />
              <Text className="text-sm text-gray-700 font-normal">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-soft-pink">
      <StatusBar barStyle="dark-content" className="bg-soft-pink" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pt-14 pb-5">
          <Text className="text-3xl font-bold text-gray-900 mb-0.5">
            MyFinTracker
          </Text>
        </View>

        <View className="px-6 mb-5">
          <View className="flex-row justify-between" style={{ gap: 12 }}>
            <BalanceCard
              backgroundColor="#B8D4B8"
              moneyBalance={2450}
              text="Saldo"
            />

            <BalanceCard
              backgroundColor="#D8E8D8"
              moneyBalance={3200}
              text="Ingresos"
            />

            <BalanceCard
              backgroundColor="#E8B4C8"
              moneyBalance={750}
              text="Gastos"
            />
          </View>
        </View>

        <View className="mx-6 mb-5 bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Distribución de Gastos
          </Text>
          <DonutChart />
        </View>

        <View className="mx-6 mb-6 bg-white rounded-xl p-6 shadow-sm">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Evolución del Saldo
          </Text>
          <LineChart
            data={lineData}
            width={screenWidth - 80}
            height={180}
            chartConfig={chartConfig}
            bezier={false}
            style={{
              borderRadius: 0,
              marginLeft: -8,
            }}
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            segments={4}
            yAxisInterval={1}
          />
        </View>

        <View className="px-6 space-y-3">
          <TouchableOpacity
            className="rounded-xl py-4 px-6"
            style={{ backgroundColor: "#226140" }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-lg font-medium mr-2">+</Text>
              <Text className="text-white font-medium text-base">
                Add widget
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
