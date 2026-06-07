import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function scheduleCallFeedback(clinicId: string, clinicName: string) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: s } = await Notifications.requestPermissionsAsync();
    if (s !== 'granted') return;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Kliniği aradın mı?',
      body: `${clinicName} telefonu açtı mı? Cevabın başkalarına yardım edecek.`,
      data: { clinicId, clinicName, type: 'call_feedback' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 600 },
  });
}
