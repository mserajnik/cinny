import { MatrixClient, RoomMember } from 'matrix-js-sdk';
import { useCallback, useMemo } from 'react';
import { Presence } from './useUserPresence';

export const MemberSort = {
  Ascending: (a: RoomMember, b: RoomMember) =>
    a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1,
  Descending: (a: RoomMember, b: RoomMember) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1,
  NewestFirst: (a: RoomMember, b: RoomMember) =>
    (b.events.member?.getTs() ?? 0) - (a.events.member?.getTs() ?? 0),
  Oldest: (a: RoomMember, b: RoomMember) =>
    (a.events.member?.getTs() ?? 0) - (b.events.member?.getTs() ?? 0),
  PresenceFirst: (mx: MatrixClient) => (a: RoomMember, b: RoomMember) => {
    // Get presence for both members
    const userA = mx.getUser(a.userId);
    const userB = mx.getUser(b.userId);
    const presenceA = (userA?.presence as Presence) ?? Presence.Offline;
    const presenceB = (userB?.presence as Presence) ?? Presence.Offline;

    // Define presence priority (lower number = higher priority)
    const presencePriority: Record<Presence, number> = {
      [Presence.Online]: 0,
      [Presence.Unavailable]: 1,
      [Presence.Offline]: 2,
    };

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

export const useMemberSortMenu = (mx: MatrixClient): MemberSortItem[] =>
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
        sortFn: MemberSort.PresenceFirst(mx),
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
    [mx]
  );

export const useMemberSort = (index: number, memberSort: MemberSortItem[]): MemberSortItem => {
  const item = memberSort[index] ?? memberSort[0];
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
