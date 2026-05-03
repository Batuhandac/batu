import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, radius, spacing } from '@/constants/theme';
import { buildDeckSummary, buildWidgetSnapshot, DEX_PARITY_FEATURES } from '@/lib/collection/dexFeatures';
import { buildOpsSnapshot, calculateGradingRoi, scoreFraudRisk } from '@/lib/commerce/ops';
import { useCollectionStore } from '@/stores/collectionStore';

export default function OpsScreen() {
  const { cards } = useCollectionStore();
  const snapshot = useMemo(() => buildOpsSnapshot(cards as any), [cards]);
  const widget = useMemo(() => buildWidgetSnapshot(cards as any), [cards]);
  const deck = useMemo(() => buildDeckSummary(cards as any), [cards]);
  const roi = calculateGradingRoi({
    rawMarketUsd: 40,
    gradedMarketUsd: 320,
    gradingCostUsd: 28,
    shippingCostUsd: 18,
  });
  const fraud = scoreFraudRisk({
    scanVerified: true,
    visualConfidence: 0.95,
    marketUsd: 120,
    condition: 'NM',
    hasReferenceImage: true,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Ops Hub</Text>
            <Text style={styles.subtitle}>B2B store-owner command center.</Text>
          </View>
          <View style={styles.healthPill}>
            <View style={styles.healthDot} />
            <Text style={styles.healthText}>System Ready</Text>
          </View>
        </View>

        <View style={styles.bento}>
          <View style={[styles.panel, styles.crossListing]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Cross-listing Status</Text>
              <Text style={styles.panelAction}>FORCE SYNC</Text>
            </View>
            <View style={styles.channelGrid}>
              <Channel name="Shopify" status="Server bridge" progress={100} tone="success" />
              <Channel name="eBay" status="OAuth needed" progress={70} tone="warning" />
              <Channel name="ikas" status="API schema ready" progress={88} tone="success" />
            </View>
          </View>

          <View style={[styles.panel, styles.priceEngine]}>
            <Text style={styles.panelTitle}>Turkey Price Engine</Text>
            <Text style={styles.bigState}>Active</Text>
            <Text style={styles.panelCopy}>FX, platform fee, shipping, margin and local liquidity rules.</Text>
            <View style={styles.statLine}>
              <Text style={styles.statLineLabel}>Data points</Text>
              <Text style={styles.statLineValue}>{snapshot.pricedCount}</Text>
            </View>
            <View style={styles.statLine}>
              <Text style={styles.statLineLabel}>Market volatility</Text>
              <Text style={styles.statLineValue}>Moderate</Text>
            </View>
          </View>

          <FeedPanel
            title="Repricing Suggestions"
            badge={`${snapshot.repricing.length} ACTIONABLE`}
            rows={
              snapshot.repricing.length
                ? snapshot.repricing.slice(0, 3).map((item) => ({
                    name: item.name,
                    detail: `Suggested ${item.currency} ${item.suggestedPrice}`,
                    action: 'UPDATE',
                  }))
                : [
                    { name: 'No repricing signal', detail: 'New market data will create suggestions.', action: 'WAIT' },
                  ]
            }
          />

          <View style={[styles.panel, styles.roiPanel]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Grading ROI Feed</Text>
              <Text style={styles.panelBadge}>ROI {roi.roiPercent}%</Text>
            </View>
            <View style={styles.roiGrid}>
              <RoiCard name="Candidate card" cost="$46" upside={`+$${roi.netProfit}`} />
              <RoiCard name="Deck snapshot" cost={`${deck.totalCards}/60`} upside={deck.readyForPlaytest ? 'Ready' : 'Build'} />
            </View>
          </View>

          <View style={styles.widgetGrid}>
            <Widget label="Bulk Scan" value={`${snapshot.bulkScan.targetBatchSize}`} detail="cards / table photo" />
            <Widget label="B2B API" value="14ms" detail="/api/scan + pricing" success />
            <Widget label="Data Moat" value={`${snapshot.moatEvents.length}`} detail="feedback events" warning />
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Dex Parity Features</Text>
            <View style={styles.featureList}>
              {DEX_PARITY_FEATURES.map((feature) => (
                <View key={feature.id} style={styles.featureRow}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureStatus}>{feature.status}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Risk and Moat</Text>
            <View style={styles.featureRow}>
              <Text style={styles.featureName}>Fake/proxy risk</Text>
              <Text style={styles.featureStatus}>{fraud.risk} ({fraud.score}/100)</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureName}>Widget snapshot</Text>
              <Text style={styles.featureStatus}>{widget.totalCards} cards</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureName}>Most valuable</Text>
              <Text style={styles.featureStatus}>{widget.mostValuableName || 'Waiting'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Channel({ name, status, progress, tone }: { name: string; status: string; progress: number; tone: 'success' | 'warning' }) {
  const color = tone === 'success' ? colors.success : colors.warning;
  return (
    <View style={styles.channel}>
      <View style={styles.channelTop}>
        <Text style={styles.channelName}>{name}</Text>
        <View style={[styles.channelDot, { backgroundColor: color }]} />
      </View>
      <Text style={styles.channelStatus}>{status}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FeedPanel({ title, badge, rows }: { title: string; badge: string; rows: { name: string; detail: string; action: string }[] }) {
  return (
    <View style={[styles.panel, styles.feedPanel]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        <Text style={styles.panelBadge}>{badge}</Text>
      </View>
      {rows.map((row) => (
        <View key={`${row.name}-${row.detail}`} style={styles.feedRow}>
          <View style={styles.thumb} />
          <View style={styles.feedText}>
            <Text style={styles.feedName} numberOfLines={1}>{row.name}</Text>
            <Text style={styles.feedDetail} numberOfLines={1}>{row.detail}</Text>
          </View>
          <Text style={styles.feedAction}>{row.action}</Text>
        </View>
      ))}
    </View>
  );
}

function RoiCard({ name, cost, upside }: { name: string; cost: string; upside: string }) {
  return (
    <View style={styles.roiCard}>
      <Text style={styles.roiName} numberOfLines={1}>{name}</Text>
      <View style={styles.roiLine}>
        <Text style={styles.roiLabel}>Cost</Text>
        <Text style={styles.roiValue}>{cost}</Text>
      </View>
      <View style={styles.roiLine}>
        <Text style={styles.roiLabel}>Net</Text>
        <Text style={styles.roiValueAccent}>{upside}</Text>
      </View>
    </View>
  );
}

function Widget({ label, value, detail, success, warning }: { label: string; value: string; detail: string; success?: boolean; warning?: boolean }) {
  return (
    <View style={styles.widget}>
      <View style={[styles.widgetIcon, success && styles.widgetIconSuccess, warning && styles.widgetIconWarning]} />
      <View style={styles.widgetText}>
        <Text style={styles.widgetLabel}>{label}</Text>
        <Text style={styles.widgetDetail}>{detail}</Text>
      </View>
      <Text style={styles.widgetValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 112 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.xxxl, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  healthDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  healthText: { color: colors.text, fontSize: fontSize.xs, fontWeight: '900' },
  bento: { gap: spacing.md, marginTop: spacing.xl },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
  },
  crossListing: {},
  priceEngine: { overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  panelTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  panelAction: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  panelBadge: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '900',
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  panelCopy: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  channelGrid: { gap: spacing.sm },
  channel: {
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  channelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  channelName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  channelDot: { width: 10, height: 10, borderRadius: radius.full },
  channelStatus: { color: colors.textMuted, fontSize: fontSize.xs },
  progressTrack: { height: 5, backgroundColor: colors.surfaceLowest, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full },
  bigState: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -0.5 },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statLineLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  statLineValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  feedPanel: { paddingBottom: 0, overflow: 'hidden' },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  thumb: { width: 34, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceHover },
  feedText: { flex: 1 },
  feedName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  feedDetail: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  feedAction: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  roiPanel: {},
  roiGrid: { flexDirection: 'row', gap: spacing.md },
  roiCard: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  roiName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900' },
  roiLine: { flexDirection: 'row', justifyContent: 'space-between' },
  roiLabel: { color: colors.textFaint, fontSize: fontSize.xs },
  roiValue: { color: colors.text, fontSize: fontSize.xs, fontWeight: '900' },
  roiValueAccent: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  widgetGrid: { gap: spacing.sm },
  widget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  widgetIcon: { width: 42, height: 42, borderRadius: radius.full, backgroundColor: colors.primaryMuted },
  widgetIconSuccess: { backgroundColor: colors.successMuted },
  widgetIconWarning: { backgroundColor: colors.warningMuted },
  widgetText: { flex: 1 },
  widgetLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  widgetDetail: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  widgetValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '900' },
  featureList: { gap: spacing.sm },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  featureName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '900', flex: 1 },
  featureStatus: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900', textAlign: 'right', flex: 1 },
});
