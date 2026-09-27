import React, { useState } from 'react';
import { Image } from 'react-native';
import { PetFace, type FaceMood } from '@/components/art';
import type { Pet } from '@/types';

/** Dostun fotoğrafı; yoksa (ya da açılamazsa) tüy rengine göre tombul maskot yüzü. */
export function PetAvatar({
  pet,
  size = 48,
  mood,
  plain,
}: {
  pet: Pick<Pet, 'id' | 'species' | 'photo_uri' | 'fur'>;
  size?: number;
  mood?: FaceMood;
  /** Pastel zemin olmadan (renkli kartın üstünde) */
  plain?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (pet.photo_uri && !failed) {
    return (
      <Image
        source={{ uri: pet.photo_uri }}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return <PetFace species={pet.species} seed={pet.id} fur={pet.fur} mood={mood} size={size} background={plain ? null : 'auto'} />;
}
