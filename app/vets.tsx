import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchClinicsByName, trFold } from '@/lib/data/query';
import { allRegisteredClinics } from '@/lib/data/registry';

function Point({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <View className="flex-row gap-3 mb-4">
      <Text className="text-2xl">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base">{title}</Text>
        <Text className="text-gray-text text-sm mt-0.5 leading-relaxed">{text}</Text>
      </View>
    </View>
  );
}

// Veteriner hekimler Türkiye'de reklam veremiyor. Bu ekran onlara reklam değil,
// doğru bilgiyle bulunabilirlik sunar: ücretsiz, sıralaması satın alınamaz.
export default function VetsScreen() {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const fq = trFold(q);
    if (fq.length < 2) return [];
    const seen = new Set<string>();
    const out: { id: string; name: string; sub: string }[] = [];
    for (const c of allRegisteredClinics()) {
      if (trFold(c.name).includes(fq) && !seen.has(c.id)) {
        seen.add(c.id);
        out.push({ id: c.id, name: c.name, sub: [c.district, c.city].filter(Boolean).join(', ') || (c.address ?? '') });
      }
    }
    for (const c of searchClinicsByName(q, 30)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push({ id: c.id, name: c.name, sub: [c.district, c.city].filter(Boolean).join(', ') || (c.address ?? '') });
      }
    }
    return out.slice(0, 20);
  }, [q]);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mb-5">
          <Text className="text-gray-text text-base">‹ Geri</Text>
        </TouchableOpacity>

        <Text className="text-3xl">🩺</Text>
        <Text className="text-white text-2xl font-bold mt-2">Veteriner hekimler için</Text>
        <Text className="text-gray-text text-base mt-2 leading-relaxed">
          Gece 03:00'te hayvanı hastalanan biri telefonunu açıp "açık veteriner" arıyor. Kliniğinizin
          orada doğru bilgiyle görünmesi için hiçbir ücret ödemeniz gerekmez.
        </Text>

        <View className="bg-card border border-border rounded-2xl p-4 mt-6">
          <Point emoji="🆓" title="Tamamen ücretsiz" text="Başvuru, doğrulama ve profil ücretsizdir; ücretli üyelik yoktur." />
          <Point
            emoji="⚖️"
            title="Reklam değil, bilgi"
            text="Sıralama satın alınamaz. Sıra yalnızca şu an açık olma, mesafe, acil kabul ve 7/24 hizmete göre belirlenir. Tanıtım metni, kampanya ya da övgü yayımlanmaz."
          />
          <Point emoji="📞" title="Doğru numara, doğru saat" text="Klinik telefonunuz, çalışma saatleriniz ve varsa mesai dışı acil hattınız hasta sahiplerine doğrudan gösterilir." />
          <Point emoji="✓" title="Klinik onaylı rozet" text="Telefonla doğrulanan klinikler 'Klinik onaylı' görünür; hasta sahipleri bilgilerin güncel olduğunu bilir." />
          <Point emoji="✏️" title="Her zaman güncel" text="Saatleriniz ya da numaranız değişirse yeni başvuruyla güncelleyebilirsiniz." />
        </View>

        <Text className="text-white font-bold text-lg mt-8">Kliniğinizi bulun</Text>
        <Text className="text-gray-text text-sm mt-1 mb-3">Adını yazın, listeden seçin ve bilgilerinizi gönderin.</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Klinik adı (ör. Pati Veteriner)"
          placeholderTextColor="#8e9196"
          className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-white text-base"
          autoCorrect={false}
        />

        {results.map((r) => (
          <TouchableOpacity
            key={r.id}
            onPress={() => router.push(`/clinic/${r.id}/claim`)}
            className="bg-card border border-border rounded-2xl px-4 py-3 mt-2 flex-row items-center"
            activeOpacity={0.85}
          >
            <View className="flex-1">
              <Text className="text-white font-semibold">{r.name}</Text>
              {r.sub ? <Text className="text-gray-muted text-xs mt-0.5" numberOfLines={1}>{r.sub}</Text> : null}
            </View>
            <Text className="text-gray-muted text-lg">›</Text>
          </TouchableOpacity>
        ))}

        {q.trim().length >= 2 && results.length === 0 && (
          <Text className="text-gray-muted text-sm mt-3">Bu isimde klinik bulamadık.</Text>
        )}

        <TouchableOpacity
          onPress={() => router.push('/clinic/new/claim')}
          className="rounded-2xl py-4 items-center mt-6 border"
          style={{ borderColor: 'rgba(255,127,28,0.5)', backgroundColor: 'rgba(255,127,28,0.1)' }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#ff7f1c', fontWeight: '700', fontSize: 15 }}>Kliniğim listede yok — başvur</Text>
        </TouchableOpacity>

        <Text className="text-gray-muted text-xs mt-6 leading-relaxed">
          Pati SOS tıbbi hizmet sunmaz ve klinikler arasında tavsiyede bulunmaz. Gösterilen bilgiler
          yalnızca hasta sahiplerinin açık bir kliniğe ulaşmasını kolaylaştırmak içindir.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
