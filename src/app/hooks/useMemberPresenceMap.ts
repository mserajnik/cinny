import { MatrixClient, RoomMember, UserEvent } from 'matrix-js-sdk';
import { useEffect, useMemo, useState } from 'react';
import { Presence } from './useUserPresence';

/**
 * Creates a presence map for members and keeps it updated when presence changes.
 * Returns a Map of userId -> Presence that automatically updates when any member's presence changes.
 */
export const useMemberPresenceMap = (
  mx: MatrixClient,
  members: RoomMember[]
): Map<string, Presence> => {
  const [presenceVersion, setPresenceVersion] = useState(0);

  // Listen to presence changes for all members
  useEffect(() => {
    const handlePresenceChange = () => setPresenceVersion((v: number) => v + 1);

    members.forEach((member) => {
      const user = mx.getUser(member.userId);
      user?.on(UserEvent.Presence, handlePresenceChange);
    });

    return () => {
      members.forEach((member) => {
        const user = mx.getUser(member.userId);
        user?.removeListener(UserEvent.Presence, handlePresenceChange);
      });
    };
  }, [members, mx]);

  // Build presence map for sorting
  return useMemo(() => {
    const map = new Map<string, Presence>();
    members.forEach((member) => {
      const user = mx.getUser(member.userId);
      if (user?.presence) {
        map.set(member.userId, user.presence as Presence);
      }
    });
    return map;
  }, [members, mx, presenceVersion]);
};
