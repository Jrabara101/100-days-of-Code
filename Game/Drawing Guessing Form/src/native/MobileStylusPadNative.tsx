/**
 * React Native & Expo Companion Component: MobileStylusPadNative
 *
 * This component provides a touch-sensitive stylus drawing pad and companion controller
 * for iOS and Android tablets/phones, broadcasting batched strokes [x, y, pressure]
 * via WebSockets or WebRTC to the main living-room TV / desktop canvas.
 *
 * Requirements for React Native project:
 * - react-native
 * - react-native-svg (for vector stroke rendering)
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  PanResponder,
  SafeAreaView,
  GestureResponderEvent,
} from 'react-native';

export interface NativeDrawPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface NativeStroke {
  points: NativeDrawPoint[];
  color: string;
  width: number;
}

interface MobileStylusPadNativeProps {
  roomId?: string;
  isArtist?: boolean;
  targetWord?: string;
  onBroadcastStroke?: (stroke: NativeStroke) => void;
  onSubmitGuess?: (guess: string) => void;
}

const PALETTE = [
  '#1E2638', // Deep Ink Navy
  '#4A4E58', // Graphite
  '#C85A32', // Burnt Sienna
  '#D9822B', // Yellow Ochre
  '#3B5E41', // Forest Moss
  '#36558F', // Indigo
  '#FDFBF7', // Chalk White
];

export const MobileStylusPadNative: React.FC<MobileStylusPadNativeProps> = ({
  roomId = 'DEN8',
  isArtist = true,
  targetWord = 'GIRAFFE',
  onBroadcastStroke,
  onSubmitGuess,
}) => {
  const [currentStroke, setCurrentStroke] = useState<NativeDrawPoint[]>([]);
  const [strokes, setStrokes] = useState<NativeStroke[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#1E2638');
  const [brushWidth, setBrushWidth] = useState<number>(6);
  const [guessText, setGuessText] = useState<string>('');

  const currentStrokeRef = useRef<NativeDrawPoint[]>([]);

  // PanResponder for touch & stylus event capture with low latency
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (!isArtist) return;
        const { locationX, locationY } = evt.nativeEvent;
        // @ts-ignore force/pressure support on iOS/Android
        const pressure = evt.nativeEvent.force || 0.5;
        const startPoint = { x: locationX, y: locationY, pressure };
        currentStrokeRef.current = [startPoint];
        setCurrentStroke([startPoint]);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        if (!isArtist) return;
        const { locationX, locationY } = evt.nativeEvent;
        // @ts-ignore
        const pressure = evt.nativeEvent.force || 0.5;
        const newPoint = { x: locationX, y: locationY, pressure };
        currentStrokeRef.current.push(newPoint);
        setCurrentStroke([...currentStrokeRef.current]);
      },
      onPanResponderRelease: () => {
        if (!isArtist) return;
        if (currentStrokeRef.current.length > 0) {
          const completedStroke: NativeStroke = {
            points: [...currentStrokeRef.current],
            color: selectedColor,
            width: brushWidth,
          };
          setStrokes((prev) => [...prev, completedStroke]);
          if (onBroadcastStroke) {
            onBroadcastStroke(completedStroke);
          }
        }
        currentStrokeRef.current = [];
        setCurrentStroke([]);
      },
    })
  ).current;

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const handleGuessSubmit = () => {
    if (!guessText.trim() || !onSubmitGuess) return;
    onSubmitGuess(guessText.trim());
    setGuessText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.roomTag}>Den #{roomId}</Text>
        <Text style={styles.promptText}>
          {isArtist ? `Draw: ${targetWord}` : 'Whisper Guess'}
        </Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Viewport */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <View style={styles.paperSheet}>
          <Text style={styles.watermark}>Pressed Cotton Rag • Stylus Active</Text>
          {/* In a full React Native app with react-native-svg, you render:
              <Svg style={StyleSheet.absoluteFill}>
                {strokes.map((s, idx) => (
                  <Path key={idx} d={pathToSvgD(s.points)} stroke={s.color} strokeWidth={s.width} fill="none" />
                ))}
              </Svg>
          */}
        </View>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {isArtist ? (
          <View style={styles.paletteRow}>
            {PALETTE.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.activeSwatch,
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.guessRow}>
            <TextInput
              style={styles.guessInput}
              value={guessText}
              onChangeText={setGuessText}
              placeholder="Whisper deduction..."
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleGuessSubmit}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#281B14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E140E',
  },
  roomTag: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 14,
  },
  promptText: {
    color: '#FFF6E9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#442F24',
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#E87D56',
    fontWeight: 'bold',
    fontSize: 12,
  },
  canvasContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paperSheet: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#F8F4EC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C5B59E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermark: {
    color: '#C4B69E',
    fontSize: 11,
    fontStyle: 'italic',
  },
  footer: {
    padding: 12,
    backgroundColor: '#1E140E',
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#666',
  },
  activeSwatch: {
    borderWidth: 3,
    borderColor: '#FDE047',
    transform: [{ scale: 1.15 }],
  },
  guessRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guessInput: {
    flex: 1,
    backgroundColor: '#FFF',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: '#C85A32',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
