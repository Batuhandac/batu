import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, AccessibilityInfo, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useTheme } from '@/lib/theme';

/** Sayfa göstergesi (iOS sayfa noktaları gibi). */
export function Dots({ count, index, color, idle }: { count: number; index: number; color?: string; idle?: string }) {
  const t = useTheme();
  if (count < 2) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === index ? color ?? t.text : idle ?? t.borderStrong,
          }}
        />
      ))}
    </View>
  );
}

/**
 * Yana kayan kart dizisi; sonraki kartın kenarı görünür (kaydırılabileceği belli olsun).
 * Otomatik geçiş dokunulduğunda ve ekran okuyucu/azaltılmış hareket açıkken durur.
 */
export function Carousel<T>({
  data,
  keyOf,
  renderItem,
  itemWidth,
  gap = 12,
  sidePadding = 20,
  autoPlayMs = 6000,
}: {
  data: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth: number;
  gap?: number;
  sidePadding?: number;
  autoPlayMs?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const touching = useRef(false);
  const [motionOk, setMotionOk] = useState(true);
  const step = itemWidth + gap;

  useEffect(() => {
    let alive = true;
    Promise.all([
      AccessibilityInfo.isScreenReaderEnabled().catch(() => false),
      AccessibilityInfo.isReduceMotionEnabled?.().catch(() => false) ?? Promise.resolve(false),
    ]).then(([sr, rm]) => alive && setMotionOk(!sr && !rm));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!autoPlayMs || !motionOk || data.length < 2) return;
    const id = setInterval(() => {
      if (touching.current) return;
      const next = (indexRef.current + 1) % data.length;
      indexRef.current = next;
      setIndex(next);
      ref.current?.scrollTo({ x: next * step, animated: true });
    }, autoPlayMs);
    return () => clearInterval(id);
  }, [autoPlayMs, motionOk, data.length, step]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(data.length - 1, Math.round(e.nativeEvent.contentOffset.x / step)));
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onTouchStart={() => (touching.current = true)}
        onTouchEnd={() => (touching.current = false)}
        onScrollBeginDrag={() => (touching.current = true)}
        onMomentumScrollEnd={() => (touching.current = false)}
      >
        {data.map((item, i) => (
          <View key={keyOf(item)} style={{ width: itemWidth }}>
            {renderItem(item, i)}
          </View>
        ))}
      </ScrollView>
      <View style={{ marginTop: 12 }}>
        <Dots count={data.length} index={index} />
      </View>
    </View>
  );
}
