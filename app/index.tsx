import { View, Text, StatusBar, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { PieChart, LineChart } from 'react-native-gifted-charts';


const MyFinTrackerScreen = () => {
  const pieData = [
    { value: 40, color: '#205C3B', text: 'Alimentación' },
    { value: 25, color: '#B5D1BA', text: 'Transporte' },
    { value: 15, color: '#E7BDBD', text: 'Ocio' },
    { value: 20, color: '#F5ECE6', text: 'Otros' },
  ];

  const lineData = [
    { value: 1950 },
    { value: 2100 },
    { value: 1800 },
    { value: 2600 },
    { value: 2300 },
    { value: 2450 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-accent-soft">
      <StatusBar barStyle="dark-content" />
        <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-primary-dark">MyFinTracker</Text>
        <Text className="text-lg mb-4 text-gray-700">Dashboard</Text>

        {/* Top Summary */}
        <View className="flex-row justify-between mb-6">
          <View className="bg-green-100 p-4 rounded-xl w-[30%]">
            <Text className="text-lg text-green-900 font-semibold">€2.450
            </Text>
            <Text className="text-sm text-gray-600">Saldo</Text>
          </View>
          <View className="bg-red-100 p-4 rounded-xl w-[30%]">
            <Text className="text-lg text-red-700 font-semibold">€3.200
            </Text>
            <Text className="text-sm text-gray-600">Ingresos</Text>
          </View>
          <View className="bg-green-100 p-4 rounded-xl w-[30%]">
            <Text className="text-lg text-green-900 font-semibold">€750
            </Text>
            <Text className="text-sm text-gray-600">Gastos</Text>
          </View>
        </View>

        {/* Pie Chart */}
        <View className="bg-white p-4 rounded-xl mb-6">
          <Text className="text-lg font-semibold mb-4">Distribución de Gastos</Text>
          <PieChart
            data={pieData}
            donut
            showText
            textColor="red"
            textSize={12}
            radius={80}
            innerRadius={50}
            centerLabelComponent={() => (
              <Text className="text-sm font-semibold text-center">Gastos</Text>
            )}
          />
          <View className="mt-4 space-y-1">
            {pieData.map((item, index) => (
              <View key={index} className="flex-row items-center space-x-2">
                <View style={{ backgroundColor: item.color }} className="w-3 h-3 rounded-full" />
                <Text>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Line Chart */}
        <View className="bg-white p-4 rounded-xl mb-6">
          <Text className="text-lg font-semibold mb-4">Evolución del Saldo</Text>
          <LineChart
            data={lineData}
            thickness={2}
            color="#205C3B"
            hideDataPoints
            showYAxis={false}
            yAxisTextStyle={{ color: '#333' }}
            areaChart
            startFillColor="#C7E8D4"
            endFillColor="#C7E8D400"
            startOpacity={0.8}
            endOpacity={0.1}
            spacing={30}
            noOfSections={4}
          />
        </View>

        {/* New Movement */}
        <TouchableOpacity className="bg-green-700 py-4 rounded-xl mb-4">
          <Text className="text-center text-white font-semibold text-base">+ Nuevo Movimiento</Text>
        </TouchableOpacity>

        {/* Config Date */}
        <TouchableOpacity className="bg-green-200 py-3 rounded-xl flex-row justify-center items-center">
          <Text className="text-base text-green-900">📅 Configurar Fecha de Inicio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="flex-row justify-around py-3 bg-white border-t border-gray-200">
        <Text className="text-green-700">🏠 Inicio</Text>
        <Text className="text-gray-500">📄 Movimientos</Text>
        <Text className="text-gray-500">📊 Presupuesto</Text>
        <Text className="text-gray-500">⚙️ Ajustes</Text>
      </View>
    </SafeAreaView>
  );
};

export default MyFinTrackerScreen;
