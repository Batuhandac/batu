import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Text, Sheet, Button, Group, ListRow, IconBadge } from '@/components/ds';
import { COMMUNITY_RULES, REPORT_REASONS, reportContent, blockUser, type ReportKind, type ReportReason } from '@/lib/data/safety';

/** İlk gönderiden önce bir kez gösterilen topluluk kuralları. */
export function RulesSheet({ visible, onClose, onAccept }: { visible: boolean; onClose: () => void; onAccept: () => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Topluluk kuralları">
      <View style={{ paddingHorizontal: 20 }}>
        <Text variant="callout" tone="muted" style={{ marginBottom: 14 }}>
          Burası dostlarımız için birbirine yardım eden insanların yeri. Paylaşmadan önce lütfen oku.
        </Text>
        {COMMUNITY_RULES.map((r) => (
          <View key={r.title} style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
            <IconBadge name={r.icon} size={32} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{r.title}</Text>
              <Text variant="caption" tone="muted" style={{ marginTop: 1 }}>
                {r.text}
              </Text>
            </View>
          </View>
        ))}
        <Button title="Kabul ediyorum" full onPress={onAccept} style={{ marginTop: 4 }} />
      </View>
    </Sheet>
  );
}

/** Gönderi/yorum için ⋯ menüsü: bildir, engelle, (kendi içeriğiyse) sil. */
export function ContentMenu({
  visible,
  onClose,
  kind,
  path,
  authorUid,
  authorName,
  isMine,
  onDelete,
  onBlocked,
}: {
  visible: boolean;
  onClose: () => void;
  kind: ReportKind;
  path: string;
  authorUid: string | null;
  authorName: string;
  isMine: boolean;
  onDelete?: () => void;
  onBlocked?: () => void;
}) {
  const [step, setStep] = useState<'menu' | 'reasons'>('menu');
  const close = () => {
    setStep('menu');
    onClose();
  };

  const report = async (reason: ReportReason) => {
    const ok = await reportContent({ kind, path, reason, author_uid: authorUid });
    close();
    Alert.alert(
      ok ? 'Teşekkürler' : 'Gönderilemedi',
      ok ? 'Bildirimini aldık. En geç 24 saat içinde inceleyeceğiz.' : 'İnternet bağlantını kontrol edip tekrar dene.'
    );
  };

  const block = () => {
    if (!authorUid) return;
    Alert.alert(`${authorName} engellensin mi?`, 'Bu kişinin soru ve yorumlarını artık görmeyeceksin.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Engelle',
        style: 'destructive',
        onPress: async () => {
          await blockUser(authorUid);
          close();
          onBlocked?.();
        },
      },
    ]);
  };

  const remove = () => {
    Alert.alert('Silinsin mi?', 'Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          close();
          onDelete?.();
        },
      },
    ]);
  };

  return (
    <Sheet visible={visible} onClose={close} title={step === 'menu' ? undefined : 'Neden bildiriyorsun?'}>
      <View style={{ paddingHorizontal: 20 }}>
        {step === 'menu' ? (
          <Group>
            {isMine ? (
              <ListRow icon="trash-outline" title="Sil" danger onPress={remove} last />
            ) : (
              <>
                <ListRow icon="flag-outline" title="Bildir" subtitle="Kurallara aykırı içerik" onPress={() => setStep('reasons')} last={!authorUid} />
                {authorUid ? <ListRow icon="ban-outline" title="Bu kişiyi engelle" subtitle={authorName} onPress={block} danger last /> : null}
              </>
            )}
          </Group>
        ) : (
          <Group>
            {REPORT_REASONS.map((r, i) => (
              <ListRow key={r.key} title={r.label} onPress={() => report(r.key)} last={i === REPORT_REASONS.length - 1} />
            ))}
          </Group>
        )}
      </View>
    </Sheet>
  );
}
