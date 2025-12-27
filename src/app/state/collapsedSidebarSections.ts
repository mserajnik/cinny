import { WritableAtom, atom } from 'jotai';
import produce from 'immer';
import {
  atomWithLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
} from './utils/atomWithLocalStorage';

const COLLAPSED_SIDEBAR_SECTIONS = 'collapsedSidebarSections';

const getStoreKey = (userId: string): string => `${COLLAPSED_SIDEBAR_SECTIONS}${userId}`;

type CollapsedSidebarSectionsAction =
  | {
      type: 'PUT';
      sectionId: string;
    }
  | {
      type: 'DELETE';
      sectionId: string;
    }
  | {
      type: 'TOGGLE';
      sectionId: string;
    };

export type CollapsedSidebarSectionsAtom = WritableAtom<
  Set<string>,
  [CollapsedSidebarSectionsAction],
  undefined
>;

export const makeCollapsedSidebarSectionsAtom = (
  userId: string
): CollapsedSidebarSectionsAtom => {
  const storeKey = getStoreKey(userId);

  const baseCollapsedSidebarSectionsAtom = atomWithLocalStorage<Set<string>>(
    storeKey,
    (key) => {
      const arrayValue = getLocalStorageItem<string[]>(key, []);
      return new Set(arrayValue);
    },
    (key, value) => {
      const arrayValue = Array.from(value);
      setLocalStorageItem(key, arrayValue);
    }
  );

  const collapsedSidebarSectionsAtom = atom<
    Set<string>,
    [CollapsedSidebarSectionsAction],
    undefined
  >(
    (get) => get(baseCollapsedSidebarSectionsAtom),
    (get, set, action) => {
      if (action.type === 'DELETE') {
        set(
          baseCollapsedSidebarSectionsAtom,
          produce(get(baseCollapsedSidebarSectionsAtom), (draft) => {
            draft.delete(action.sectionId);
          })
        );
        return;
      }
      if (action.type === 'PUT') {
        set(
          baseCollapsedSidebarSectionsAtom,
          produce(get(baseCollapsedSidebarSectionsAtom), (draft) => {
            draft.add(action.sectionId);
          })
        );
        return;
      }
      if (action.type === 'TOGGLE') {
        set(
          baseCollapsedSidebarSectionsAtom,
          produce(get(baseCollapsedSidebarSectionsAtom), (draft) => {
            if (draft.has(action.sectionId)) {
              draft.delete(action.sectionId);
            } else {
              draft.add(action.sectionId);
            }
          })
        );
      }
    }
  );

  return collapsedSidebarSectionsAtom;
};

export const clearCollapsedSidebarSectionsStore = (userId: string) => {
  localStorage.removeItem(getStoreKey(userId));
};
