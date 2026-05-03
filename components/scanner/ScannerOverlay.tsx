import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');
const FRAME_SIZE = width * 0.75;

export function ScannerOverlay() {
  const lineY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, { toValue: FRAME_SIZE - 4, duration: 1600, useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
  }, [lineY]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.mask} />
      <View style={styles.row}>
        <View style={styles.mask} />
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          <Animated.View style={[styles.scanLine, { transform: [{ translateY: lineY }] }]} />
        </View>
        <View style={styles.mask} />
      </View>
      <View style={styles.mask} />
    </View>
  );
}

const MASK = 'rgba(0,0,0,0.62)';
const CORNER_COLOR = '#47EAED';
const CORNER_SIZE = 24;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: MASK },
  row: { flexDirection: 'row', height: FRAME_SIZE },
  frame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 8, right: 8, height: 2, backgroundColor: CORNER_COLOR, opacity: 0.8, borderRadius: 1 },
});
