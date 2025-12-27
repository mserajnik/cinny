import { MatrixClient, RoomMember, User, UserEvent } from 'matrix-js-sdk';
import { useEffect, useMemo, useState } from 'react';
import { Presence, UserPresence } from './useUserPresence';

const getUserPresence = (user: User): UserPresence => ({
  presence: (user.presence as Presence) ?? Presence.Offline,
  status: user.presenceStatusMsg,
  active: user.currentlyActive,
  lastActiveTs: user.getLastActiveTs(),
});

/**
 * Creates a presence map for members and keeps it updated when presence changes.
 * Returns a Map of userId -> Presence that automatically updates when any member's presence changes.
 */
export const useMemberPresenceMap = (
  mx: MatrixClient,
  members: RoomMember[]
): Map<string, UserPresence> => {
  const [presenceVersion, setPresenceVersion] = useState(0);

  // Listen to presence changes for all members
  useEffect(() => {
    const handlePresenceChange = () => setPresenceVersion((v: number) => v + 1);

    members.forEach((member) => {
      const user = mx.getUser(member.userId);
      user?.on(UserEvent.Presence, handlePresenceChange);
      user?.on(UserEvent.CurrentlyActive, handlePresenceChange);
      user?.on(UserEvent.LastPresenceTs, handlePresenceChange);
    });

    return () => {
      members.forEach((member) => {
        const user = mx.getUser(member.userId);
        user?.removeListener(UserEvent.Presence, handlePresenceChange);
        user?.removeListener(UserEvent.CurrentlyActive, handlePresenceChange);
        user?.removeListener(UserEvent.LastPresenceTs, handlePresenceChange);
      });
    };
  }, [members, mx]);

  // Build presence map for sorting
  return useMemo(() => {
    const map = new Map<string, UserPresence>();
    members.forEach((member) => {
      const user = mx.getUser(member.userId);
      if (user) {
        map.set(member.userId, getUserPresence(user));
      }
    });
    return map;
  }, [members, mx, presenceVersion]);
};
