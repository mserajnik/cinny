import { RoomMember } from 'matrix-js-sdk';
import { useCallback, useMemo } from 'react';
import { Presence } from './useUserPresence';

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
  PresenceFirst: (presenceMap: Map<string, Presence>) => (a: RoomMember, b: RoomMember) => {
    const presenceA = presenceMap.get(a.userId) ?? Presence.Offline;
    const presenceB = presenceMap.get(b.userId) ?? Presence.Offline;

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
        sortFn: MemberSort.Ascending, // Placeholder, actual function created in useMemberSort
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
  presenceMap?: Map<string, Presence>
): MemberSortItem => {
  const item = memberSort[index] ?? memberSort[0];

  // If this is the Presence sort option and we have a presence map, use it
  if (item.name === 'Presence' && presenceMap) {
    return {
      name: item.name,
      sortFn: MemberSort.PresenceFirst(presenceMap),
    };
  }

  return item;
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
