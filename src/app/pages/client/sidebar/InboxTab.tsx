import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Icons } from 'folds';
import { useAtom, useAtomValue } from 'jotai';
import {
  SidebarAvatar,
  SidebarItem,
  SidebarItemBadge,
  SidebarItemTooltip,
} from '../../../components/sidebar';
import { allInvitesAtom } from '../../../state/room-list/inviteList';
import {
  getInboxInvitesPath,
  getInboxNotificationsPath,
  getInboxPath,
  joinPathComponent,
} from '../../pathUtils';
import { useInboxSelected } from '../../../hooks/router/useInbox';
import { UnreadBadge } from '../../../components/unread-badge';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { useNavToActivePathAtom } from '../../../state/hooks/navToActivePath';
import { useCollapsedSidebarSectionsAtom } from '../../../state/hooks/collapsedSidebarSections';

export function InboxTab() {
  const screenSize = useScreenSizeContext();
  const navigate = useNavigate();
  const navToActivePath = useAtomValue(useNavToActivePathAtom());
  const [collapsedSections, setCollapsedSections] = useAtom(useCollapsedSidebarSectionsAtom());
  const inboxSelected = useInboxSelected();
  const allInvites = useAtomValue(allInvitesAtom);
  const inviteCount = allInvites.length;

  const handleInboxClick = () => {
    // On mobile, just navigate
    if (screenSize === ScreenSize.Mobile) {
      navigate(getInboxPath());
      return;
    }

    // On desktop, if already selected, toggle collapse
    if (inboxSelected) {
      setCollapsedSections({ type: 'TOGGLE', sectionId: 'inbox' });
      return;
    }

    // If not selected, expand (if collapsed) and navigate
    if (collapsedSections.has('inbox')) {
      setCollapsedSections({ type: 'DELETE', sectionId: 'inbox' });
    }

    const activePath = navToActivePath.get('inbox');
    if (activePath) {
      navigate(joinPathComponent(activePath));
      return;
    }

    const path = inviteCount > 0 ? getInboxInvitesPath() : getInboxNotificationsPath();
    navigate(path);
  };

  return (
    <SidebarItem active={inboxSelected}>
      <SidebarItemTooltip tooltip="Inbox">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} outlined onClick={handleInboxClick}>
            <Icon src={Icons.Inbox} filled={inboxSelected} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {inviteCount > 0 && (
        <SidebarItemBadge hasCount>
          <UnreadBadge highlight count={inviteCount} />
        </SidebarItemBadge>
      )}
    </SidebarItem>
  );
}
