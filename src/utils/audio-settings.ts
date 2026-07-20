const AUDIO_GROUP_KEY_PREFIX = 'audioGroup';

export const getAudioVolume = (group: string): number => {
  const rawValue = window.localStorage.getItem(
    `${AUDIO_GROUP_KEY_PREFIX}_${group}`,
  );
  return Number(rawValue ?? 1);
};

export const saveAudioVolume = (group: string, value: number): void => {
  window.localStorage.setItem(
    `${AUDIO_GROUP_KEY_PREFIX}_${group}`,
    String(value),
  );
};
