import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const accent = '#ff583f';
const bg = '#090a0b';
const panel = '#17181b';
const panelLight = '#202126';
const border = '#2a2b30';
const text = '#f8f6f2';
const muted = '#9d9a96';

export default function RequestDetailsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#17100e', bg, bg]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color="#d8d5d1" />
          </Pressable>
          <Text style={styles.headerTitle}>Request details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.requestCard}>
          <View style={styles.requestTop}>
            <View style={styles.clockIcon}>
              <Ionicons name="time-outline" size={22} color={accent} />
            </View>
            <View style={styles.requestTitleBlock}>
              <Text style={styles.requestTitle}>60-minute photo session</Text>
              <Text style={styles.requestSubtitle}>Portrait - 1 person</Text>
            </View>
            <Pressable style={styles.editButton}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <DetailRow
            icon={<Ionicons name="location-sharp" size={16} color="#d6d3ce" />}
            label="Location"
            value="San Francisco, CA"
          />
          <DetailRow
            icon={<Ionicons name="calendar-outline" size={15} color="#d6d3ce" />}
            label="Date & time"
            value="Sat, May 24 - 4:00 PM"
          />
          <DetailRow
            icon={<MaterialCommunityIcons name="currency-usd" size={16} color="#d6d3ce" />}
            label="Budget"
            value="$250 - $400"
            last
          />
        </View>

        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planTitleRow}>
              <MaterialCommunityIcons name="auto-fix" size={20} color={accent} />
              <Text style={styles.planTitle}>Picnear Plan</Text>
            </View>
            <Text style={styles.generated}>Generated for you</Text>
          </View>
          <View style={styles.planRule} />
          <Text style={styles.planCopy}>
            We've crafted the best plan{'\n'}based on your request.
          </Text>

          <View style={styles.planBody}>
            <View style={styles.mapWrap}>
              <MapPreview />
            </View>
            <View style={styles.stops}>
              <PlanStop
                number="1"
                title="Palace of Fine Arts"
                subtitle="Best lighting - 4:00 PM"
              />
              <PlanStop number="2" title="Baker Beach" subtitle="Scenic - 4:25 PM" />
              <PlanStop number="3" title="Lands End Lookout" subtitle="Golden hour - 4:50 PM" />
            </View>
          </View>

          <Pressable style={styles.fullPlanButton}>
            <Text style={styles.fullPlanText}>View full plan</Text>
            <Ionicons name="chevron-forward" size={15} color="#f5f2ed" />
          </Pressable>
        </View>

        <View style={styles.secureCard}>
          <View style={styles.shield}>
            <MaterialCommunityIcons name="shield-check-outline" size={29} color="#ffffff" />
          </View>
          <View style={styles.secureCopy}>
            <Text style={styles.secureTitle}>Secure your session</Text>
            <Text style={styles.secureText}>
              Your payment is held securely{'\n'}and only released after your{'\n'}session is confirmed.
            </Text>
          </View>
          <Text style={styles.protectedText}>Protected{'\n'}payment hold</Text>
        </View>

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalSub}>Includes planning + photographer</Text>
          </View>
          <View style={styles.totalValueRow}>
            <Text style={styles.totalValue}>$320</Text>
            <Ionicons name="chevron-down" size={15} color="#f0ece7" />
          </View>
        </View>

        <Pressable style={styles.bookButton}>
          <Ionicons name="lock-closed" size={15} color="#ffffff" />
          <Text style={styles.bookText}>Book securely</Text>
        </Pressable>
        <Text style={styles.cancelText}>Free cancellation up to 24h before</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={15} color="#d7d3ce" />
    </View>
  );
}

function PlanStop({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.stopRow}>
      <View style={styles.stopNumber}>
        <Text style={styles.stopNumberText}>{number}</Text>
      </View>
      <View style={styles.stopCopy}>
        <Text style={styles.stopTitle}>{title}</Text>
        <Text style={styles.stopSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function MapPreview() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 148 128">
      <Defs>
        <RadialGradient id="mapGlow" cx="42%" cy="38%" r="75%">
          <Stop offset="0" stopColor="#34383b" />
          <Stop offset="1" stopColor="#202326" />
        </RadialGradient>
      </Defs>
      <Rect width="148" height="128" rx="8" fill="url(#mapGlow)" />
      <Path d="M-4 36 C24 28 45 48 68 40 C90 32 107 15 151 20" stroke="#303338" strokeWidth="1.2" fill="none" />
      <Path d="M-5 91 C24 70 41 73 66 91 C89 107 114 96 152 108" stroke="#303338" strokeWidth="1.2" fill="none" />
      <Path d="M34 -2 C47 24 50 54 42 85 C38 103 43 117 52 132" stroke="#303338" strokeWidth="1.2" fill="none" />
      <Path d="M108 -2 C104 27 103 58 112 83 C119 104 118 119 112 132" stroke="#303338" strokeWidth="1.2" fill="none" />
      <Line x1="0" y1="64" x2="148" y2="64" stroke="#282b2f" strokeWidth="0.8" />
      <Line x1="74" y1="0" x2="74" y2="128" stroke="#282b2f" strokeWidth="0.8" />
      <Path
        d="M33 69 C52 56 67 75 83 65 C99 55 103 35 116 25"
        stroke={accent}
        strokeWidth="2.4"
        strokeDasharray="5 5"
        fill="none"
        strokeLinecap="round"
      />
      <Pin x={116} y={25} number="1" />
      <Pin x={33} y={69} number="2" />
      <Pin x={50} y={107} number="3" />
    </Svg>
  );
}

function Pin({ x, y, number }: { x: number; y: number; number: string }) {
  return (
    <>
      <Circle cx={x} cy={y} r="10" fill="#252024" stroke={accent} strokeWidth="2" />
      <TextSvg x={x} y={y + 3} text={number} />
    </>
  );
}

function TextSvg({ x, y, text: value }: { x: number; y: number; text: string }) {
  return (
    <SvgText x={x} y={y} fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle">
      {value}
    </SvgText>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: bg,
  },
  content: {
    paddingHorizontal: 23,
    paddingTop: 7,
    paddingBottom: 14,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1d1e22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 38,
  },
  requestCard: {
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: panel,
    borderWidth: 1,
    borderColor: '#24252a',
    overflow: 'hidden',
  },
  requestTop: {
    minHeight: 70,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#232429',
  },
  clockIcon: {
    width: 36,
    alignItems: 'flex-start',
  },
  requestTitleBlock: {
    flex: 1,
  },
  requestTitle: {
    color: text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  requestSubtitle: {
    color: muted,
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#2a2b30',
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  editText: {
    color: '#e7e3de',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    height: 48,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#232429',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 28,
  },
  detailLabel: {
    width: 90,
    color: '#b9b5af',
    fontSize: 12,
  },
  detailValue: {
    flex: 1,
    color: text,
    fontSize: 12,
    fontWeight: '600',
  },
  planCard: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: panel,
    borderWidth: 1,
    borderColor: accent,
    padding: 14,
    shadowColor: accent,
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  planTitle: {
    color: text,
    fontSize: 17,
    fontWeight: '700',
  },
  generated: {
    color: accent,
    fontSize: 9,
    fontWeight: '700',
  },
  planRule: {
    height: 1,
    backgroundColor: '#28282d',
    marginTop: 13,
    marginBottom: 11,
  },
  planCopy: {
    color: text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  planBody: {
    flexDirection: 'row',
    gap: 11,
  },
  mapWrap: {
    width: 141,
    height: 128,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2b2f32',
  },
  stops: {
    flex: 1,
    justifyContent: 'center',
    gap: 13,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  stopNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stopNumberText: {
    color: text,
    fontSize: 9,
    fontWeight: '700',
  },
  stopCopy: {
    flex: 1,
  },
  stopTitle: {
    color: text,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
  stopSubtitle: {
    color: '#aaa6a0',
    fontSize: 9,
    lineHeight: 13,
  },
  fullPlanButton: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullPlanText: {
    color: text,
    fontSize: 12,
    fontWeight: '700',
  },
  secureCard: {
    marginTop: 10,
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: panel,
    borderWidth: 1,
    borderColor: border,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shield: {
    width: 34,
    height: 38,
    borderRadius: 7,
    backgroundColor: accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  secureCopy: {
    flex: 1,
  },
  secureTitle: {
    color: text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  secureText: {
    color: '#aaa6a0',
    fontSize: 9.5,
    lineHeight: 12,
  },
  protectedText: {
    color: accent,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
    lineHeight: 14,
  },
  totalCard: {
    marginTop: 10,
    minHeight: 61,
    borderRadius: 8,
    backgroundColor: panelLight,
    borderWidth: 1,
    borderColor: border,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: text,
    fontSize: 12,
    fontWeight: '800',
  },
  totalSub: {
    color: '#aaa6a0',
    fontSize: 10,
    marginTop: 4,
  },
  totalValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalValue: {
    color: text,
    fontSize: 19,
    fontWeight: '800',
  },
  bookButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: accent,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bookText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelText: {
    color: '#aaa6a0',
    fontSize: 10,
    marginTop: 10,
    textAlign: 'center',
  },
});
