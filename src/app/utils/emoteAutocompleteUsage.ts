import { getLocalStorageItem, setLocalStorageItem } from '../state/utils/atomWithLocalStorage';

const EMOTE_AUTOCOMPLETE_USAGE_KEY = 'emoteAutocompleteUsage';

export type EmoteUsageStore = Record<string, number>;

export const getEmoteUsageStoreKey = (userId: string): string =>
  `${EMOTE_AUTOCOMPLETE_USAGE_KEY}:${userId}`;

export const getEmoteUsageStore = (userId?: string): EmoteUsageStore => {
  if (!userId) return {};
  return getLocalStorageItem<EmoteUsageStore>(getEmoteUsageStoreKey(userId), {});
};

export const incrementEmoteUsage = (userId: string | undefined, emoteId: string): number => {
  if (!userId) return 0;
  const storeKey = getEmoteUsageStoreKey(userId);
  const store = getLocalStorageItem<EmoteUsageStore>(storeKey, {});
  const nextValue = (store[emoteId] ?? 0) + 1;
  setLocalStorageItem(storeKey, { ...store, [emoteId]: nextValue });
  return nextValue;
};
