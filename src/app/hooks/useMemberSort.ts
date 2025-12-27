import { RoomMember } from 'matrix-js-sdk';
import { useCallback, useMemo } from 'react';
import { Presence, UserPresence } from './useUserPresence';

const presencePriority: Record<Presence, number> = {
  [Presence.Online]: 0,
  [Presence.Unavailable]: 1,
  [Presence.Offline]: 2,
};

export const MemberSort = {
  Ascending: (a: RoomMember, b: RoomMember) =>
    a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1,
  Descending: (a: RoomMember, b: RoomMember) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1,
  NewestFirst: (a: RoomMember, b: RoomMember) =>
    (b.events.member?.getTs() ?? 0) - (a.events.member?.getTs() ?? 0),
  Oldest: (a: RoomMember, b: RoomMember) =>
    (a.events.member?.getTs() ?? 0) - (b.events.member?.getTs() ?? 0),
  PresenceFirst: (presenceMap: Map<string, UserPresence>) => (a: RoomMember, b: RoomMember) => {
    const presenceA = presenceMap.get(a.userId)?.presence ?? Presence.Offline;
    const presenceB = presenceMap.get(b.userId)?.presence ?? Presence.Offline;

    const priorityA = presencePriority[presenceA] ?? 2;
    const priorityB = presencePriority[presenceB] ?? 2;

    // Primary sort by presence
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort alphabetically
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
  },
};

export type MemberSortFn = (a: RoomMember, b: RoomMember) => number;

export type MemberSortItem = {
  name: string;
  sortFn: MemberSortFn;
};

// Sort option indices
export const MEMBER_SORT_INDEX = {
  ASCENDING: 0,
  DESCENDING: 1,
  PRESENCE: 2,
  NEWEST: 3,
  OLDEST: 4,
} as const;

export const useMemberSortMenu = (): MemberSortItem[] =>
  useMemo(
    () => [
      {
        name: 'A to Z',
        sortFn: MemberSort.Ascending,
      },
      {
        name: 'Z to A',
        sortFn: MemberSort.Descending,
      },
      {
        name: 'Presence',
        sortFn: MemberSort.Ascending, // Placeholder, replaced in useMemberSort when presence map is available
      },
      {
        name: 'Newest',
        sortFn: MemberSort.NewestFirst,
      },
      {
        name: 'Oldest',
        sortFn: MemberSort.Oldest,
      },
    ],
    []
  );

export const useMemberSort = (
  index: number,
  memberSort: MemberSortItem[],
  presenceMap?: Map<string, UserPresence>
): MemberSortItem => {
  return useMemo(() => {
    const item = memberSort[index] ?? memberSort[0];

    // If Presence sort is selected and we have presence data, use it
    if (index === MEMBER_SORT_INDEX.PRESENCE && presenceMap) {
      return {
        name: item.name,
        sortFn: MemberSort.PresenceFirst(presenceMap),
      };
    }

    return item;
  }, [index, memberSort, presenceMap]);
};

export const useMemberPowerSort = (
  creators: Set<string>,
  getPowerLevel: (userId: string) => number
): MemberSortFn => {
  const sort: MemberSortFn = useCallback(
    (a, b) => {
      if (creators.has(a.userId) && creators.has(b.userId)) {
        return 0;
      }
      if (creators.has(a.userId)) return -1;
      if (creators.has(b.userId)) return 1;

      return getPowerLevel(b.userId) - getPowerLevel(a.userId);
    },
    [creators]
  );

  return sort;
};
