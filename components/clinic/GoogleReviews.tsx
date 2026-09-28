// Klinik sayfasında Google yorumları. Google koşulları: her yorumda yazarın adı,
// fotoğrafı ve profil bağlantısı; kaynağa (Google Maps) doğrudan erişim; "Google
// Maps" atfı; içerik cihaza kaydedilmez. Yorumlar ücretli bir API alanı olduğu
// için yalnızca kullanıcı isteyince çekilir.
//
// Klinik başka kaynaktan geldiyse (oda listesi, OpenStreetMap, Apple) ve Google
// eşi henüz birleşmemişse, "Yorumları göster"e basınca önce Google'da adıyla
// aranır; yalnızca aynı klinik olduğu kesinse (ad + yakınlık) yorumları gösterilir.
import React, { useState } from 'react';
import { View, Image, Pressable, Linking, ActivityIndicator } from 'react-native';
import { Text, Card, Button, Section, Avatar } from '@/components/ds';
import { Stars } from '@/components/ui/Stars';
import { useTheme } from '@/lib/theme';
import { fetchPlaceReviews, isPlacesConfigured, type GoogleReviews as Reviews } from '@/lib/data/places';
import { findGooglePlaceId } from '@/lib/data/googleMatch';
import type { Clinic } from '@/types';
import { track } from '@/lib/analytics';

const open = (url: string | null) => {
  if (url) Linking.openURL(url).catch(() => {});
};

export function GoogleReviews({ clinic }: { clinic: Clinic }) {
  const t = useTheme();
  const [data, setData] = useState<Reviews | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (!isPlacesConfigured) return null;
  const rating = clinic.source === 'google' || clinic.google_place_id ? clinic.rating : null;

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const placeId = await findGooglePlaceId(clinic);
      track('google_reviews_open', { clinic_id: clinic.id, found: !!placeId });
      if (!placeId) {
        setNotFound(true);
        return;
      }
      setData(await fetchPlaceReviews(placeId));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const shownRating = data?.rating ?? rating;
  const shownCount = data?.count ?? (rating ? clinic.rating_count : undefined);

  return (
    <Section title="Google yorumları">
      <Card style={{ gap: 12 }}>
        {shownRating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text variant="display">{shownRating.toFixed(1).replace('.', ',')}</Text>
            <View>
              <Stars value={shownRating} size={16} />
              {shownCount ? (
                <Text variant="caption" tone="muted" style={{ marginTop: 2 }}>
                  Google'da {shownCount} değerlendirme
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {notFound ? (
          <Text variant="callout" tone="muted">
            Bu klinik Google'da bulunamadı.
          </Text>
        ) : !data ? (
          loading ? (
            <ActivityIndicator color={t.primary} style={{ marginVertical: 8 }} />
          ) : (
            <>
              {failed ? (
                <Text variant="caption" tone="danger">
                  Yorumlar şu an yüklenemedi. Biraz sonra tekrar dene.
                </Text>
              ) : null}
              <Button title="Yorumları göster" icon="chatbubbles-outline" variant="secondary" onPress={load} />
            </>
          )
        ) : data.reviews.length === 0 ? (
          // Google bazen yorum metinlerini API'de vermiyor (puan ve sayı gelse de);
          // "yorum yok" demek yanıltıcı olur, Google Maps'e yönlendir
          <Text variant="callout" tone="muted">
            Yazılı yorumlar burada gösterilemiyor; Google Maps'te okuyabilirsin.
          </Text>
        ) : (
          data.reviews.map((r, i) => (
            <View key={i} style={{ gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border }}>
              <Pressable
                onPress={() => open(r.author_uri)}
                disabled={!r.author_uri}
                accessibilityRole="link"
                accessibilityLabel={`${r.author}, Google profili`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                {r.author_photo ? (
                  <Image source={{ uri: r.author_photo }} style={{ width: 32, height: 32, borderRadius: 16 }} accessibilityIgnoresInvertColors />
                ) : (
                  <Avatar label={r.author} size={32} />
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {r.author}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Stars value={r.rating} size={12} />
                    <Text variant="caption" tone="subtle">
                      {r.when}
                    </Text>
                  </View>
                </View>
              </Pressable>
              {r.text ? (
                <Text variant="callout" numberOfLines={8}>
                  {r.text}
                </Text>
              ) : null}
            </View>
          ))
        )}

        {data?.maps_uri ? (
          <Button
            title="Tüm yorumlar Google Maps'te"
            icon="open-outline"
            variant="ghost"
            size="sm"
            onPress={() => open(data.maps_uri)}
            style={{ alignSelf: 'flex-start', marginLeft: -8 }}
          />
        ) : null}
        <Text variant="caption" tone="subtle" style={{ fontSize: 12 }}>
          Kaynak: Google Maps
        </Text>
      </Card>
    </Section>
  );
}
