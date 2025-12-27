import React from 'react';
import { Icon, Icons } from 'folds';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { useExploreSelected } from '../../../hooks/router/useExploreSelected';
import {
  getExploreFeaturedPath,
  getExplorePath,
  getExploreServerPath,
  joinPathComponent,
} from '../../pathUtils';
import { useClientConfig } from '../../../hooks/useClientConfig';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { getMxIdServer } from '../../../utils/matrix';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { useNavToActivePathAtom } from '../../../state/hooks/navToActivePath';
import { useCollapsedSidebarSectionsAtom } from '../../../state/hooks/collapsedSidebarSections';

export function ExploreTab() {
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const clientConfig = useClientConfig();
  const navigate = useNavigate();
  const navToActivePath = useAtomValue(useNavToActivePathAtom());
  const [collapsedSections, setCollapsedSections] = useAtom(useCollapsedSidebarSectionsAtom());

  const exploreSelected = useExploreSelected();

  const handleExploreClick = () => {
    // On mobile, just navigate
    if (screenSize === ScreenSize.Mobile) {
      navigate(getExplorePath());
      return;
    }

    // On desktop, if already selected, toggle collapse
    if (exploreSelected) {
      setCollapsedSections({ type: 'TOGGLE', sectionId: 'explore' });
      return;
    }

    // If not selected, expand (if collapsed) and navigate
    if (collapsedSections.has('explore')) {
      setCollapsedSections({ type: 'DELETE', sectionId: 'explore' });
    }

    const activePath = navToActivePath.get('explore');
    if (activePath) {
      navigate(joinPathComponent(activePath));
      return;
    }

    if (clientConfig.featuredCommunities?.openAsDefault) {
      navigate(getExploreFeaturedPath());
      return;
    }
    const userId = mx.getUserId();
    const userServer = userId ? getMxIdServer(userId) : undefined;
    if (userServer) {
      navigate(getExploreServerPath(userServer));
      return;
    }
    navigate(getExplorePath());
  };

  return (
    <SidebarItem active={exploreSelected}>
      <SidebarItemTooltip tooltip="Explore Community">
        {(triggerRef) => (
          <SidebarAvatar as="button" ref={triggerRef} outlined onClick={handleExploreClick}>
            <Icon src={Icons.Explore} filled={exploreSelected} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
