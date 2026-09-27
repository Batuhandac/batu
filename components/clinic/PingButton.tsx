import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Card, Text, Button, Icon } from '@/components/ds';
import { useTheme } from '@/lib/theme';
import { submitOpenPing, isFirebaseConfigured } from '@/lib/data/community';
import { track } from '@/lib/analytics';

// "Şu an açık mı?" — kliniği az önce arayan ya da önünden geçen kullanıcının teyidi.
export function PingButton({ clinicId }: { clinicId: string }) {
  const t = useTheme();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const ping = async (isOpen: boolean) => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    const ok = await submitOpenPing(clinicId, isOpen);
    track('open_ping_submitted', { clinic_id: clinicId, is_open: isOpen, saved: ok });
    setState(ok ? 'sent' : 'failed');
  };

  if (!isFirebaseConfigured) return null;

  if (state === 'sent') {
    return (
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="heart" size={20} color={t.primary} />
        <Text variant="callout" tone="primary" style={{ flex: 1 }}>
          Teşekkürler, başka pati sahiplerine yardım ettin.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text variant="bodyStrong">Bu klinik şu an açık mı?</Text>
      <Text variant="caption" tone="muted" style={{ marginTop: 2, marginBottom: 12 }}>
        Az önce aradıysan ya da oradaysan bildir.
      </Text>
      {state === 'sending' ? (
        <ActivityIndicator color={t.primary} />
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Açık" icon="checkmark" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => ping(true)} />
          <Button title="Kapalı" icon="close" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => ping(false)} />
        </View>
      )}
      {state === 'failed' && (
        <Text variant="caption" tone="danger" style={{ marginTop: 8 }}>
          Gönderilemedi — bağlantını kontrol edip tekrar dene.
        </Text>
      )}
    </Card>
  );
}
