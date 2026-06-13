// Anonim cihaz kimliği — yorum sahipliği için (Firebase Auth gerektirmez).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'patisos:device_id';
const NAME_KEY = 'patisos:author_name';
let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(KEY, id);
  }
  cached = id;
  return id;
}

export async function getAuthorName(): Promise<string> {
  return (await AsyncStorage.getItem(NAME_KEY)) ?? 'Pati dostu';
}

export async function setAuthorName(name: string): Promise<void> {
  await AsyncStorage.setItem(NAME_KEY, name.trim() || 'Pati dostu');
}
