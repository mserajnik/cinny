import React, { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo } from 'react';
import { Editor } from 'slate';
import { Box, MenuItem, Text, toRem } from 'folds';
import { Room } from 'matrix-js-sdk';

import { AutocompleteQuery } from './autocompleteQuery';
import { AutocompleteMenu } from './AutocompleteMenu';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { UseAsyncSearchOptions, useAsyncSearch } from '../../../hooks/useAsyncSearch';
import { onTabPress } from '../../../utils/keyboard';
import { createEmoticonElement, moveCursor, replaceWithElement } from '../utils';
import { useRelevantImagePacks } from '../../../hooks/useImagePacks';
import { useKeyDown } from '../../../hooks/useKeyDown';
import { mxcUrlToHttp } from '../../../utils/matrix';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { ImageUsage, PackImageReader } from '../../../plugins/custom-emoji';
import { getEmoticonSearchStr } from '../../../plugins/utils';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { getEmoteUsageStore, incrementEmoteUsage } from '../../../utils/emoteAutocompleteUsage';

type EmoticonSearchItem = PackImageReader;
type EmoticonCompleteHandler = (emoticon: EmoticonSearchItem) => void;

type EmoticonAutocompleteProps = {
  imagePackRooms: Room[];
  editor: Editor;
  query: AutocompleteQuery<string>;
  requestClose: () => void;
};

const SEARCH_OPTIONS: UseAsyncSearchOptions = {
  matchOptions: {
    contain: true,
  },
};

export function EmoticonAutocomplete({
  imagePackRooms,
  editor,
  query,
  requestClose,
}: EmoticonAutocompleteProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [emoteAutocompleteAmount] = useSetting(settingsAtom, 'emoteAutocompleteAmount');
  const [emoteAutocompleteSortByUsage] = useSetting(
    settingsAtom,
    'emoteAutocompleteSortByUsage'
  );
  const userId = mx.getSafeUserId();

  const imagePacks = useRelevantImagePacks(ImageUsage.Emoticon, imagePackRooms);

  const searchList = useMemo(() => {
    const list: Array<EmoticonSearchItem> = [];
    return list.concat(
      imagePacks.flatMap((pack) => pack.getImages(ImageUsage.Emoticon))
    );
  }, [imagePacks]);

  const [result, search, resetSearch] = useAsyncSearch(
    searchList,
    getEmoticonSearchStr,
    SEARCH_OPTIONS
  );
  const getEmoteUsageId = useCallback((emoticon: EmoticonSearchItem): string => {
    return `mxc:${emoticon.url}`;
  }, []);

  const usageStore = useMemo(
    () => (emoteAutocompleteSortByUsage ? getEmoteUsageStore(userId) : {}),
    [emoteAutocompleteSortByUsage, userId]
  );

  const orderedEmoticon = useMemo(() => {
    const baseList = result ? result.items : searchList;
    if (!emoteAutocompleteSortByUsage) return baseList;

    const withUsage = baseList.map((item, index) => ({
      item,
      index,
      usage: usageStore[getEmoteUsageId(item)] ?? 0,
    }));

    withUsage.sort((a, b) => {
      if (a.usage !== b.usage) return b.usage - a.usage;
      return a.index - b.index;
    });

    return withUsage.map(({ item }) => item);
  }, [result, searchList, emoteAutocompleteSortByUsage, usageStore, getEmoteUsageId]);

  const autoCompleteEmoticon = orderedEmoticon.slice(0, emoteAutocompleteAmount);

  useEffect(() => {
    if (query.text) search(query.text);
    else resetSearch();
  }, [query.text, search, resetSearch]);

  const handleAutocomplete: EmoticonCompleteHandler = (emoticon) => {
    const key = emoticon.url;
    if (emoteAutocompleteSortByUsage) {
      incrementEmoteUsage(userId, getEmoteUsageId(emoticon));
    }
    const emoticonEl = createEmoticonElement(key, emoticon.shortcode);
    replaceWithElement(editor, query.range, emoticonEl);
    moveCursor(editor, true);
    requestClose();
  };

  useKeyDown(window, (evt: KeyboardEvent) => {
    onTabPress(evt, () => {
      if (autoCompleteEmoticon.length === 0) return;
      handleAutocomplete(autoCompleteEmoticon[0]);
    });
  });

  return autoCompleteEmoticon.length === 0 ? null : (
    <AutocompleteMenu headerContent={<Text size="L400">Emotes</Text>} requestClose={requestClose}>
      {autoCompleteEmoticon.map((emoticon: EmoticonSearchItem) => {
        const key = emoticon.url;
        const customEmojiUrl = mxcUrlToHttp(mx, key, useAuthentication);

        return (
          <MenuItem
            key={emoticon.shortcode + key}
            as="button"
            radii="300"
            onKeyDown={(evt: ReactKeyboardEvent<HTMLButtonElement>) =>
              onTabPress(evt, () => handleAutocomplete(emoticon))
            }
            onClick={() => handleAutocomplete(emoticon)}
            before={
              customEmojiUrl ? (
                <Box
                  shrink="No"
                  as="img"
                  src={customEmojiUrl}
                  alt={emoticon.shortcode}
                  style={{ width: toRem(24), height: toRem(24), objectFit: 'contain' }}
                />
              ) : (
                <Box
                  shrink="No"
                  as="span"
                  display="InlineFlex"
                  style={{ fontSize: toRem(24), lineHeight: toRem(24) }}
                >
                  :{emoticon.shortcode}:
                </Box>
              )
            }
          >
            <Text style={{ flexGrow: 1 }} size="B400" truncate>
              :{emoticon.shortcode}:
            </Text>
          </MenuItem>
        );
      })}
    </AutocompleteMenu>
  );
}
