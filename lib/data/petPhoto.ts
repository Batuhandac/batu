// Dost fotoğrafları cihazda kalır. Galeriden gelen dosya geçici önbellekte
// olduğu için kalıcı belge klasörüne kopyalanır (iOS önbelleği temizleyebilir).
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const DIR = `${FileSystem.documentDirectory ?? ''}pet-photos/`;

export async function savePetPhoto(sourceUri: string, petKey: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return sourceUri;
  try {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const dest = `${DIR}${petKey}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return sourceUri;
  }
}

export async function deletePetPhoto(uri: string | null | undefined): Promise<void> {
  if (!uri || Platform.OS === 'web' || !uri.startsWith(DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
