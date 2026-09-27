import React, { useState } from 'react';
import { Image } from 'react-native';
import { Avatar } from '@/components/ds';
import type { Pet } from '@/types';

/** Dostun fotoğrafı; yoksa (ya da açılamazsa) adının baş harfi. */
export function PetAvatar({
  pet,
  size = 48,
  color,
  background,
  ring,
}: {
  pet: Pick<Pet, 'name' | 'photo_uri'>;
  size?: number;
  color?: string;
  background?: string;
  ring?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (pet.photo_uri && !failed) {
    return (
      <Image
        source={{ uri: pet.photo_uri }}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: ring ? 2 : 0, borderColor: ring }}
      />
    );
  }
  return <Avatar label={pet.name} size={size} color={color} background={background} />;
}
