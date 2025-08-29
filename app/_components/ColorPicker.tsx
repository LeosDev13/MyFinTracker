import Slider from '@react-native-community/slider';
import { Palette, X } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface ColorPickerProps {
  visible: boolean;
  onClose: () => void;
  onColorSelect: (color: string) => void;
  initialColor?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ visible, onClose, onColorSelect }) => {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(60);

  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 1 / 3) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 1 / 2) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 2 / 3) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }, []);

  const rgbToHex = useCallback((r: number, g: number, b: number) => {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  const hslToHex = useCallback(
    (h: number, s: number, l: number) => {
      const rgb = hslToRgb(h, s, l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    },
    [hslToRgb, rgbToHex]
  );

  const currentColor = hslToHex(hue, saturation, lightness);

  const handleSubmit = () => {
    onColorSelect(currentColor);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 min-h-[400px]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Palette size={24} color="#1F5F43" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Custom Color</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Color Preview */}
          <View className="mb-6">
            <Text className="text-base font-medium text-gray-700 mb-3">Preview</Text>
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 rounded-xl border-2 border-gray-200 mr-4"
                style={{ backgroundColor: currentColor }}
              />
              <View>
                <Text className="text-lg font-mono font-bold text-gray-900">
                  {currentColor.toUpperCase()}
                </Text>
                <Text className="text-sm text-gray-500">
                  HSL({Math.round(hue)}, {Math.round(saturation)}%, {Math.round(lightness)}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Hue Slider */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-medium text-gray-700">Hue</Text>
              <Text className="text-sm text-gray-500">{Math.round(hue)}°</Text>
            </View>
            <View className="mb-2">
              <Svg width="100%" height={20}>
                <Defs>
                  <LinearGradient id="hue" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#FF0000" />
                    <Stop offset="16.66%" stopColor="#FFFF00" />
                    <Stop offset="33.33%" stopColor="#00FF00" />
                    <Stop offset="50%" stopColor="#00FFFF" />
                    <Stop offset="66.66%" stopColor="#0000FF" />
                    <Stop offset="83.33%" stopColor="#FF00FF" />
                    <Stop offset="100%" stopColor="#FF0000" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height={20} fill="url(#hue)" rx={10} />
              </Svg>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={360}
              value={hue}
              onValueChange={setHue}
              minimumTrackTintColor="transparent"
              maximumTrackTintColor="transparent"
              thumbTintColor={currentColor}
            />
          </View>

          {/* Saturation Slider */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-medium text-gray-700">Saturation</Text>
              <Text className="text-sm text-gray-500">{Math.round(saturation)}%</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={100}
              value={saturation}
              onValueChange={setSaturation}
              minimumTrackTintColor="#E5E7EB"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={currentColor}
            />
          </View>

          {/* Lightness Slider */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-medium text-gray-700">Lightness</Text>
              <Text className="text-sm text-gray-500">{Math.round(lightness)}%</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={10}
              maximumValue={90}
              value={lightness}
              onValueChange={setLightness}
              minimumTrackTintColor="#E5E7EB"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={currentColor}
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 rounded-xl border border-gray-300"
            >
              <Text className="text-center text-base font-medium text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              className="flex-1 py-4 rounded-xl bg-[#1F5F43]"
            >
              <Text className="text-center text-white font-medium text-base">Select Color</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ColorPicker;
export { ColorPicker };
