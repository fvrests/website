---
title: Lavender (refactor)
pubDate: 2024-09-06
cover:
  src: ~/assets/lavender-refactor/cover.png
  alt: Lavender app. Stylized digital time within a thin rectangle border reads "03:41 in the afternoon". Below are the date and weather ("86 degrees / cloudy") with a small cloud and wind icon. The app is atop a dark background with illustrated constellations and mountain ranges in the distance.
tags: ['projects']
---

## Project links

- [Chrome Web Store](https://chrome.google.com/webstore/detail/lavender-new-tab/ffobepdbanoiodmfimpmanafepclokbc)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/lavender-new-tab/)
- [Web app](https://lavender.fvrests.dev)
- [Source code](https://github.com/fvrests/lavender)

Lavender is a minimalist landing page and safe haven for maintaining focus and purpose in the browser. In modern UI patterns, both default and user-installed browser homepages are often designed to provide easy access to links, bookmarks, and shared items, leading the new tab page to resemble a dumping ground for accumulated internet sludge.

Some well-adjusted people might be able to handle this, but me? Forget it -- my overactive brain will self-destruct the shred of a thought it had meant to cling to in order to get me from one task to the next. Lavender, though, is meant for those like me -- it challenges convention by providing a spa-like clean slate with only the time and weather, encouraging a mental break between tasks, and all in a stylish minimalist getup that might just convince you never to use your browser like you're digging through the back of your refrigerator again.

## 2024 Issues and Technical Debt

Lavender was originally released in 2020 as a Chrome extension, and was met with love from a small community of users. It proved surprisingly stable overall, but like many software projects, Lavender was burdened with a few skeletons in its closet:

- Pretty soon after release, Chrome began transitioning to Manifest V3, changing the way extensions are implemented in Chrome. In addition to [controversy](https://www.eff.org/deeplinks/2021/12/chrome-users-beware-manifest-v3-deceitful-and-threatening) claiming [questionable tactics](https://www.zdnet.com/article/google-chromes-new-rules-for-extensions-may-disable-your-favorite-browser-tools/) behind the V3 transition (which I encourage you to form your own opinion on), this change also put Lavender at risk of falling out of compliance.

- Lavender's state management library, [Vuex](https://vuex.vuejs.org), was deprecated in the ever-whirling sands of front-end-framework favor and replaced by [Pinia](https://pinia.vuejs.org).

- Users took the time to request support for additional browsers. This filled my soul, because it meant that Lavender was impactful enough for people to request it on other platforms! It was also quite inconvenient, because I had implemented data storage via Chrome's built-in Storage API, causing errors that would stop the app from loading in any other browser.

- Finally, the biggest skeleton of all -- imagine, if you will, that the other issues were your average small house skeletons. In comparison, this issue was the giant Home Depot lawn skeleton of misconfigured code:

  <img src="/src/assets/lavender-refactor/skeleton.jpeg" alt="Photo of a giant 12-ft tall lawn skeleton decoration dressed as a pirate, holding a large flagpole flying the Jolly Roger. Smaller skeletons positioned around him appear to pull at strings tied to his arms, guiding him like a marionette to some nefarious end." width="50%" style="margin: 0 auto;"></img>

  Lavender's weather API key was periodically blocked due to excessive requests. The first time this happened, I burst into a cold sweat, fearing the worst for my little app. Then I checked the API dashboard - after a brief lock-out from the API service, my key was reinstated. The weather gods smiling upon me, the app would function as normal for weeks to months before the key was blocked again. Speaking of weather gods, the folks at [OpenWeatherMap.org](https://openweathermap.org) earn that well-deserved title for building their rate-limiting in a charitably user-friendly manner, in contrast with some other [rather brazen](https://wheresbaldo.dev/tech/netlify/is-hosting-on-netlify-going-to-bankrupt-you) usage limit policies we're accustomed to from other freemium web services.

  Now, it's punk to make software, but not to take advantage of good people providing a free API with reasonable limits, so I aimed to fix these issues in Lavender's new incarnation, even if the challenge broke me (this would turn out to be a bit too close of a call).

### Refactor

Eager to rescue Lavender from the impending downward slide into oblivion, I dove into writing a big update. I accepted a pull request from a kind contributor to use Chrome's V3 manifest for the extension (open source, baby!), upgraded the state management library to Pinia (the lovable fruit mascot made this better), and implemented Vite for a better build process and local testing (like stepping into the future). I added a "Reset all data" feature to the settings menu to allow better user control of data, and designed 6 new dark themes along with a dynamic light / dark mode.

To expand lavender's compatibility to other platforms, I reworked the data flow to use the browser localStorage by default, and re-implemented Chrome storage as an opt-in enhancement for users who prefer to sync across Chrome instances. This change allowed Lavender to function in any browser. More importantly, it prioritized users' control of their data by avoiding sending it off-device until necessary, and made the app more efficient to run in terms of bandwidth and energy consumption -- a step towards implementing a more [local-first](https://www.inkandswitch.com/local-first/) approach in a small way.

Importantly, I needed to get my absolutely out-of-control weather call infrastructure in line to make lavender more reliable and safer to run without incurring extra costs.

![Alignment chart meme template with nine zones characterizing a Punnett-square-type array of lawful, neutral and chaotic types of good and evil. The template is filled out with diagrams of different ways to slice a sandwich, but the 'chaotic evil' square is overlaid with 'lavender app weather fetch infrastructure'.](../../assets/lavender-refactor/alignment-chart.jpg)

I suspected that the timeout loop that refreshes Lavender's weather every 30 minutes was being duplicated, or that multiple tabs were prone to firing independent API requests, and that either or both were likely to blame for our API-related misfortunes. I resolved to add controls for all of the above in hopes of keeping requests at a minimum. Finally, I realized I could further trim usage and add intentional redundancy to the rate-limiting system by preventing inactive instances from requesting the weather at all. Cue "no rogue requests": a mission log in three parts.

### No rogue requests, part I: duplicate API calls from the running instance

First objective: ensure that a single instance of lavender behaved predictably. There's more explanation in the [first lavender post](https://www.fvrests.dev/notes/lavender) about `setCorrectingInterval` and its benefits, but assume it's analogous to the JS `setInterval` function -- I used this in lavender to update the time and weather on a regular basis. Well, it _was_ regular until multiple intervals were set. When some events in lavender's lifecycle happened, such as fetching a new location or resetting the app's data, it was possible to start a new weather fetch loop without clearing the old one, potentially resulting in a pileup over time where multiple intervals were making API requests at a frequency much higher than intended.

The difficulty in pinning down this loop is that in the utility function I used, `setCorrectingInterval`, the interval recursively calls itself, with a new timeout ID each repetition. Simply saving the ID created when starting the loop results in an outdated reference as soon as the loop repeats. Once this happens, you have a runaway unclearable timeout loop on your hands.

To avoid this problem, I added a clearInterval function and kept track of the current timeout IDs in the state, outside of the function.

```ts
export const useInstanceStore = defineStore('instance', {
    // store current timeoud IDs by name -- allows for
    // multiple named intervals running concurrently
	state: () => ({
		timeoutIds: {} as { [name: string]: number },
	}),
    actions: {
    // clear the current timeout by name. this results in an
    // interruption of the recursive interval loop, as no new
    // timeout will be set after the current iteration.
    	clearInterval(name: string) {
			clearTimeout(this.timeoutIds[name])
			delete this.timeoutIds[name]
		},
    }
}
```

This way, I could update the stored ID whenever a new timeout was set, and clear the existing interval by name when restarting the interval and anytime the loop repeated.

```ts
setCorrectingInterval(func: () => {} | void, delay: number, name: string) {
    // ...
    // recurring timeout loop
    let store = this
        function tick(func: () => void | {}, delay: number) {
            // clear interval any time a new one is set.
            // this should avoid duplication of the same named
            // interval.
            store.clearInterval(name)
                // ...
        }

    tick(func, delay)
}
```

### No rogue requests, part II: API calls from multiple instances

Second objective: having improved the behavior of a single instance, I still had a problem on my hands if multiple tabs running at once hit the API. I approached this with the classic program-the-first-idea-that-pops-into-your-head tactic -- which led to setting up a broadcast channel to create instance 'identities', designating main and secondary instances of lavender. The idea was that when a new instance was opened, it would alert a shared channel, and the main instance would reply that it was already running. The secondary instance could then take a backseat on API calls, and instead wait for the main instance to update the weather data in localStorage. A basic scaffolding for this functionality is below.

```js
const broadcastChannel = new BroadcastChannel('data');

// can be stored in state and used to determine
// API call behavior; e.g. only make a call if priority = 1
let priority = 1;

// alert other instances that a new tab has opened
broadcastChannel.postMessage('new instance opened');

// if an instance is already open, alert other instances on
// message received
broadcastChannel.onmessage = (eventMessage) => {
	broadcastChannel.postMessage('instance already running');
};

// if receiving a message from another instance that is
// already open, demote own instance's priority to 2
broadcastChannel.onmessage = (eventMessage) => {
	if (eventMessage === 'instance already running') {
		priority = 2;
	}
};
```

Just one (big) problem: this implementation can get totally out of hand when more than two tabs might be open. Which is to say that in the real world, each tab needs not only a "main" / "secondary" identity, but also a queue position to choose which instance should inherit top dog status if the main tab is closed. For this to work, each instance would also need an up-to-date list of others and their priorities in case, say, the second-runner-up is closed and the third should move up in the queue. Then they all have to squawk to each other to say what they're doing and what should happen next. It all starts to look a bit more like an episode of 'Succession' than an orderly and precise web application.

Thankfully, I managed to salvage this plan by having a second idea, one with a little more runway. I could still salvage the broadcast channel setup above, but rather than trying to prioritize the instances themselves, I could sync a shared 'fetching' status instead. That way, any instance that wanted to make an API call could check if another instance was already doing so, and skip its own fetch if so. A snippet of this process as used to update the Pinia data store is below.

```ts
import { defineStore } from 'pinia';

// Set up broadcast channel. Ensure that this is only set
// once per app instance. If you call this multiple times, you
// WILL create multiple channels, receive duplicate messages
// and spend a long time trying to fix the bug.
const broadcastChannel = new BroadcastChannel('data');

export const useDataStore = defineStore('data', {
	state: () => ({
		weather: { fetching: false as boolean } as Weather,
	}),
	actions: {
		messageAllInstances(message: {}) {
			// utility function that sends a message to all
			// app instances
			broadcastChannel.postMessage(JSON.stringify(message));
		},
		// once (on start), subscribe to the channel and
		// automate writing new messages into the state as
		// JSON. manually call this somewhere in the app.
		initialize() {
			broadcastChannel.onmessage = (eventMessage) => {
				this.$patch(JSON.parse(eventMessage.data.toString()));
			};
		},
		refreshWeather(lat: number, long: number) {
			// return early if another instance is already
			// fetching weather.
			if (this.weather.fetching) {
				console.log('an instance is already fetching weather. skipping fetch');
				return;
			}

			// set fetching to true in all instances before
			// running the API call. this prevents duplicate
			// calls, as any other instances attempting fetch
			// will return early based on the if statement above.
			this.weather.fetching = true;
			this.messageAllInstances({ weather: { fetching: true } });

			// fetch weather as normal. function definition
			// not included here for brevity.
			fetchWeather(lat, long).then(
				(res) => {
					let updatedWeather = {
						...res,
						fetching: false,
					};
					// set new weather into state, and
					// message all instances new data with a
					// false fetching state.
					this.$patch({ weather: updatedWeather });
					this.messageAllInstances({
						weather: updatedWeather,
					});
				},
				(err: any) => {
					// make sure to set a false fetching
					// state on error as well. allows other
					// instances to attempt fetch again.
					this.weather.fetching = false;
					this.messageAllInstances({
						weather: { fetching: false },
					});
				}
			);
		},
	},
});
```

This worked as planned -- when an instance fetched the weather, it would message the channel, leading each other instance to store a fetching value of `true`. Other instances would also receive updated weather information from the fetching instance, eliminating the need for any further calls until a later interval, when the process would be repeated.

### No rogue requests, part III: API calls from inactive windows

It's certainly possible that the broadcast channel system above could fail. One guaranteed point of failure is if some variety-happy user opened tabs in every browser at once and left them running. Not probable, I suppose, but definitely possible. Another could be if a user was viewing on an outdated browser version or a platform like IE that does not support the broadcastChannel API.

Enter final objective: ensure, to the greatest extent possible, that inactive windows would not make API calls at all. This would add a layer of safety to my API structure by limiting the possible scope of any excessive requests to the currently active window. With the help of the `clearInterval` function added in [part I](#no-rogue-requests-part-i-duplicate-api-calls-from-the-running-instance), I appointed an event listener to respond to visibility changes by stopping and starting the intervals appropriately, depending on active state.

```ts
initialize() {
    this.init = true
    this.startClock()
		// listen to visibility & pause fetch when hidden
    document.addEventListener('visibilitychange', () => {
        if (this.init && document.hidden) {
            // page became hidden -- clear intervals
            this.clearInterval('time')
            this.clearInterval('weather')
        } else {
			// page became visible -- call functions that
            // restart interval loops
            this.startClock()
            let localData = useDataStore().parseLocalData() if (localData?.position?.latitude && localData?.position?.longitude) {
                useDataStore().refreshWeatherIfInvalidated()
                useDataStore().subscribeToWeather()
            }
        }
    })
    // ...
},
```

## No more skeletons. Right?

While there still could be instances where all failsafes are surpassed, lavender aspires to be less data-intensive, more user-focused, and more predictable with the changes included in 2.0. I hope to maintain lavender in the long term and keep it running (for free!) for the foreseeable future -- as long as any remaining skeletons don't make too much of a commotion.

## Utility references

- [Vue 3](https://vuejs.org) framework & composition API
- State management with [Pinia](https://pinia.vuejs.org)
- Asynchronous API calls with [OpenWeather API](https://openweathermap.org/)
- User settings sync with [Chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- Build process enhanced with [Vite](https://vitejs.dev)
- Local test server powered by [Bun](https://bun.sh)
