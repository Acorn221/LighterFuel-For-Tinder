import { debug } from '@/misc/config';
import type { ImageType, TabMessage } from '@/misc/types';
import browser from 'webextension-polyfill';

import { Storage } from '@plasmohq/storage';

/**
 * This filters through all the tabs and sends the info to them
 *
 */
export const sendImageDataToTab =
  (obj: ImageType | ImageType[]) => async (resolve) => {
    try {
      const arrIn = Array.isArray(obj);
      // query all tabs
      const unfilteredTabs = browser.tabs.query({});
      // filter to only ones we have permission to look at
      const tabs = await unfilteredTabs.then((x) => x.filter((y) => y.url));

      if (tabs.length === 0) return;

      await Promise.all(
        tabs.map((tab) => {
          if (tab.id) {
            const msg: TabMessage = {
              action: arrIn ? 'new images' : 'new image',
              data: obj,
            };
            return browser.tabs.sendMessage(tab.id, msg).catch((e) => {
              if (debug) console.log(e);
            });
          }
          return undefined;
        }),
      );
    } catch (e) {
      console.log(`There were no tabs to send the data to ${e}`);
    }
  };

export const getFunMode = async () => {
  const storage = new Storage();
  let funMode = await storage.get<boolean>('funMode');

  if (funMode === undefined) {
    await storage.set('funMode', true);
    funMode = true;
  }

  return funMode;
};
