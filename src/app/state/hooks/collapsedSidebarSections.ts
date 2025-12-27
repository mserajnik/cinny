import { createContext, useContext } from 'react';
import { CollapsedSidebarSectionsAtom } from '../collapsedSidebarSections';

const CollapsedSidebarSectionsAtomContext = createContext<CollapsedSidebarSectionsAtom | null>(
  null
);
export const CollapsedSidebarSectionsProvider = CollapsedSidebarSectionsAtomContext.Provider;

export const useCollapsedSidebarSectionsAtom = (): CollapsedSidebarSectionsAtom => {
  const anAtom = useContext(CollapsedSidebarSectionsAtomContext);

  if (!anAtom) {
    throw new Error('CollapsedSidebarSectionsAtom is not provided!');
  }

  return anAtom;
};
