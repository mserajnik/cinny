import { ReactNode } from 'react';
import { useMatch } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';
import { DIRECT_PATH, EXPLORE_PATH, HOME_PATH, INBOX_PATH, SPACE_PATH } from './paths';
import { useCollapsedSidebarSectionsAtom } from '../state/hooks/collapsedSidebarSections';

type MobileFriendlyClientNavProps = {
  children: ReactNode;
};
export function MobileFriendlyClientNav({ children }: MobileFriendlyClientNavProps) {
  const screenSize = useScreenSizeContext();
  const homeMatch = useMatch({ path: HOME_PATH, caseSensitive: true, end: true });
  const directMatch = useMatch({ path: DIRECT_PATH, caseSensitive: true, end: true });
  const spaceMatch = useMatch({ path: SPACE_PATH, caseSensitive: true, end: true });
  const exploreMatch = useMatch({ path: EXPLORE_PATH, caseSensitive: true, end: true });
  const inboxMatch = useMatch({ path: INBOX_PATH, caseSensitive: true, end: true });

  if (
    screenSize === ScreenSize.Mobile &&
    !(homeMatch || directMatch || spaceMatch || exploreMatch || inboxMatch)
  ) {
    return null;
  }

  return children;
}

type MobileFriendlyPageNavProps = {
  path: string;
  children: ReactNode;
};
export function MobileFriendlyPageNav({ path, children }: MobileFriendlyPageNavProps) {
  const screenSize = useScreenSizeContext();
  const collapsedSections = useAtomValue(useCollapsedSidebarSectionsAtom());
  const exactPath = useMatch({
    path,
    caseSensitive: true,
    end: true,
  });

  // On mobile, only show if on exact path
  if (screenSize === ScreenSize.Mobile && !exactPath) {
    return null;
  }

  // On desktop, check if the section is collapsed
  if (screenSize !== ScreenSize.Mobile) {
    // Determine section ID from path
    let sectionId: string | null = null;
    if (path === HOME_PATH) sectionId = 'home';
    else if (path === DIRECT_PATH) sectionId = 'direct';
    else if (path === EXPLORE_PATH) sectionId = 'explore';
    else if (path === INBOX_PATH) sectionId = 'inbox';
    // For spaces, use the space path itself as the section ID
    else if (path === SPACE_PATH) {
      // Spaces are handled per-space, so we'd need the specific space ID
      // For now, spaces don't support collapse functionality
      sectionId = null;
    }

    // If this section is collapsed on desktop, don't render the PageNav
    if (sectionId && collapsedSections.has(sectionId)) {
      return null;
    }
  }

  return children;
}
