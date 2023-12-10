/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React, { useState, useEffect } from 'react';
import ukraineFlag from 'svg-country-flags/svg/ua.svg';
import '@/popup/style.css';
import Switch from '@mui/material/Switch';
import { AiOutlineSetting, AiOutlineInfoCircle } from 'react-icons/ai';
import { DiGoogleAnalytics } from 'react-icons/di';
import { useStorage } from '@plasmohq/storage/hook';
import browser from 'webextension-polyfill';
import {
  debug,
  defaultSettings, links, text,
} from '@/misc/config';
import logo from '~assets/LighterFuel512.png';

import { openTab } from '@/misc/utils';
import { AnalyticsEvent } from '@/misc/GA';

enum menuOptions {
  settings,
  info,
}

const IndexPopup = () => {
  const [data, setData] = useState('');
  const [menuTab, setMenuTab] = useState<menuOptions>(menuOptions.settings);
  const [showSettings, setShowSettings] = useStorage('showSettings', (x) => (x === undefined ? defaultSettings : x));

  useEffect(() => {
    AnalyticsEvent([
      {
        name: 'page_view',
        params: {
          page_title: 'popup',
        },
      },
    ]);
  }, []);

  useEffect(() => {
    AnalyticsEvent([
      {
        name: 'event',
        params: {
          event_category: 'settings',
          event_label: 'settings-change',
          value: JSON.stringify(showSettings),
        },
      },
    ]);
  }, [showSettings]);

  useEffect(() => {
    // fill in any of the blanks with the actual settings and new defaults
    const newSettings = { ...defaultSettings, ...showSettings };
    setShowSettings(newSettings);
  }, []);

  return (
    <div className="App text-center w-[280px] font['Roboto', sans-serif] text-2xl font-light bg-slate-900 text-white p-5 select-none gap-2 flex flex-col">
      <div className="grid justify-center cursor-pointer" onClick={() => openTab(links.reviews)}>
        <img src={logo} className="h-32 w-32 select-none" alt="logo" />
      </div>

      <div className="flex justify-center align-middle">
        <div className="grid grid-cols-2 w-44 gap-4 m-auto">
          <div className="flex align-middle justify-center">
            <AiOutlineSetting className={`m-auto w-20 h-20 bg-slate-600 p-2 cursor-pointer ${(menuTab === menuOptions.settings) ? 'bg-slate-500' : 'bg-slate-600'} hover:outline-offset-2 outline-white outline`} onClick={() => setMenuTab(menuOptions.settings)} />
          </div>
          <div className="flex align-middle justify-center">
            <AiOutlineInfoCircle className={`m-auto w-20 h-20 bg-slate-600 p-2 cursor-pointer ${(menuTab === menuOptions.info) ? 'bg-slate-500' : 'bg-slate-600'} hover:outline-offset-2 outline-white outline`} onClick={() => setMenuTab(menuOptions.info)} />
          </div>
          <div className="flex align-middle justify-center">
            <DiGoogleAnalytics className="m-auto w-20 h-20 bg-slate-600 p-2 cursor-pointer hover:outline-offset-2 outline-white outline" onClick={() => openTab(browser.runtime.getURL('tabs/consent.html'))} />
          </div>
          <div className="flex align-middle justify-center">
            <img
              src={ukraineFlag}
              className="m-auto w-20 h-20 bg-slate-600 p-2 cursor-pointer hover:outline-offset-2 outline-white outline"
              onClick={() => openTab(links.ukraineAppeal)}
            />
          </div>
        </div>
      </div>

      {menuTab === menuOptions.settings && (
        <div className="flex justify-center align-middle m-2 flex-col gap-2">
          <div className="flex flex-col justify-center m-auto bg-slate-800 w-44 hover:outline-offset-2 outline-white outline">
            <div>
              {text.enableOverlay}
            </div>

            <Switch
              checked={showSettings.overlayButton}
              onChange={() => setShowSettings({ ...showSettings, overlayButton: !showSettings.overlayButton })}
              inputProps={{ 'aria-label': 'controlled' }}
              aria-label={text.enableOverlay}
              className="m-auto"
            />
          </div>
          <div className="flex flex-col justify-center m-auto bg-slate-800 w-44 hover:outline-offset-2 outline-white outline">
            <div>
              {text.enableSearchButton}
            </div>

            <Switch
              checked={showSettings.searchButton}
              onChange={() => setShowSettings({ ...showSettings, searchButton: !showSettings.searchButton })}
              inputProps={{ 'aria-label': 'controlled' }}
              aria-label={text.enableSearchButton}
              className="m-auto"
            />
          </div>
          <div className="flex flex-col justify-center m-auto bg-slate-800 w-44 hover:outline-offset-2 outline-white outline">
            <div>
              {text.enableStreamerMode}
            </div>

            <Switch
              checked={showSettings.streamerMode}
              onChange={() => setShowSettings({ ...showSettings, streamerMode: !showSettings.streamerMode })}
              inputProps={{ 'aria-label': 'controlled' }}
              aria-label={text.enableStreamerMode}
              className="m-auto"
            />
          </div>
        </div>
      )}

      {menuTab === menuOptions.info && (
        <div className="text-base m-2 p-2 bg-slate-800">
          {text.info.text}
        </div>
      )}
    </div>
  );
};

export default IndexPopup;
