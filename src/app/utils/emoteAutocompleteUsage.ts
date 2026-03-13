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

export const clearEmoteUsageStore = (userId: string | undefined) => {
  if (!userId) return;
  localStorage.removeItem(getEmoteUsageStoreKey(userId));
};

export const pruneEmoteUsageStore = (
  userId: string | undefined,
  validIds: Set<string>,
  maxSize: number
): EmoteUsageStore => {
  if (!userId) return {};
  const storeKey = getEmoteUsageStoreKey(userId);
  const store = getLocalStorageItem<EmoteUsageStore>(storeKey, {});
  const entries = Object.entries(store).filter(([key]) => validIds.has(key));

  if (entries.length > maxSize) {
    entries.sort((a, b) => b[1] - a[1]);
    entries.length = maxSize;
  }

  const nextStore: EmoteUsageStore = Object.fromEntries(entries);
  setLocalStorageItem(storeKey, nextStore);
  return nextStore;
};
