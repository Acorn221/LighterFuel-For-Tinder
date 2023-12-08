/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
import { sendToBackgroundViaRelay } from '@plasmohq/messaging';
import { debug } from '~src/misc/config';
import type { Match, Person } from '~src/misc/tinderTypes';

type rec = {
	user: Person;
};

class ProfileGetter {
  lastPingTime = Date.now();

  constructor() {
    this.setCustomFetch();
  }

  /**
   * Sets a passthrough for the fetch so we can monitor requests
   * TODO: make this look nicer
   */
  setCustomFetch() {
    // save default fetch
    console.log('Setting custom fetch');

    const nativeFetch = window.fetch;
    window.fetch = (...args) => new Promise((resolve, reject) => {
      nativeFetch(...args).then((result) => {
        this.handleFetchResponse(result.clone(), args);
        resolve(result);
      }).catch((err) => reject(err));
    });
  }

  /**
   * TODO: move this to an external helper file
   * This method is to handle the response from the custom fetch when one appears
   * @param {Response} result The result from the fetch
   * @param {Array} args The arguments sent back
   */
  async handleFetchResponse(result: Response, args: any[]) {
    const regexChecks = {
      matches: /https:\/\/api.gotinder.com\/v2\/matches\?/g,
      updates: /https:\/\/api.gotinder.com\/updates\?/g, // https://api.gotinder.com/updates?locale=en-GB
      myLikes: /https:\/\/api.gotinder.com\/v2\/my-likes\?/g,
      fastMatch: /https:\/\/api.gotinder.com\/v2\/fast-match\?/g,
      core: /https:\/\/api.gotinder.com\/v2\/recs\/core\/*/g,
      profile: /https:\/\/api.gotinder.com\/v2\/profile\/*/g,
      user: /https:\/\/api.gotinder.com\/user\/([A-z0-9]+)/g,
      messages: /https:*:\/\/api.gotinder.com\/v2\/matches\/([A-z0-9]+)\/messages\?/g,
    };

    try {
      const jsonOut = await result.json();

      if (args[0].match(regexChecks.matches)) {
        this.handleNewMatches(jsonOut);
      } else if (args[0].match(regexChecks.core) || args[0].match(regexChecks.myLikes)) {
        this.handleNewCore(jsonOut);
      } else if (args[0].match(regexChecks.profile)) {
        this.handleProfile(jsonOut);
      } else if (args[0].match(regexChecks.fastMatch)) {
        this.handleFastMatch(jsonOut);
      }
    } catch (e) {
      console.error(e);
      // if the response is not json, ignore it
    }
  }

  handleFastMatch(jsonOut: any) {
    if (!Array.isArray(jsonOut?.data?.results)) console.error('Invalid fast match response');

    const newRecs: rec[] = jsonOut.data.results;
    const people = [];

    newRecs.forEach((rec) => {
      const person = rec.user;

      person.type = 'rec';
      people.push(person);
      if (debug) console.log('new person added from fast match!', person);
    });

    this.sendPeopleToBackground(people);
  }

  handleNewMatches(jsonOut: any) {
    if (!Array.isArray(jsonOut?.data?.matches)) console.error('Invalid matches response');

    const newMatches: Match[] = jsonOut.data.matches;

    const people = [];

    newMatches.forEach((match) => {
      // getting the person from the match

      if ('user' in match) {
        const { user } = match as any;
        user.type = 'match';
        people.push(user);
      } else if ('person' in match) {
        const { person } = match;
        person.type = 'match';
        people.push(person);
      }
    });

    this.sendPeopleToBackground(people);
  }

  handleNewUpdates(jsonOut: any) {
    if (!Array.isArray(jsonOut?.matches)) console.error('Invalid updates response');

    const newMatches: Match[] = jsonOut.matches;

    const people = [];

    newMatches.forEach((match) => {
      // getting the person from the match
      const { person } = match;
      person.type = 'match';
      people.push(person);
    });

    this.sendPeopleToBackground(people);
  }

  handleNewCore(jsonOut: any) {
    if (debug) console.log('core recs', jsonOut);
    if (!Array.isArray(jsonOut?.data?.results)) console.error('Invalid core response');

    const newRecs: rec[] = jsonOut.data.results;
    const people = [];

    newRecs.forEach((rec) => {
      const person = rec.user;

      person.type = 'rec';
      people.push(person);
      if (debug) console.log('new person added from core!', person);
    });

    this.sendPeopleToBackground(people);
  }

  handleProfile(jsonOut: any) {
    if (debug) console.log('profile', jsonOut);
    if (!Array.isArray(jsonOut?.data?.results)) console.error('Invalid profile response');

    if (!jsonOut.data.user) return;

    const person = jsonOut.data.user;

    person.type = 'profile';

    this.sendPeopleToBackground([person]);
  }

  sendPeopleToBackground(people: Person[]) {
    if (chrome.runtime?.id) {
      sendToBackgroundViaRelay({
        name: 'getPeople',
        body: {
          people,
        },
      });
      this.lastPingTime = Date.now();
    }
  }

  beginPingPongLoop() {
    setInterval(() => {
      if (Date.now() - this.lastPingTime > 1000 * 60 * 4) {
        this.ping();
      }
    }, 1000 * 60);
  }

  ping() {
    if (chrome.runtime?.id) {
      sendToBackgroundViaRelay({
        name: 'pong',
      });
      this.lastPingTime = Date.now();
    }
  }
}

export default ProfileGetter;
