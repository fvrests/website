---
title: Lavender
pubDate: 2020-08-19
cover:
  src: /lavender/lavender.jpg
  alt: Lavender app in a browser window on a dark background with lavender plants, moon and stars
tags: ['projects']
---

Lavender is a minimalist Chrome new tab extension born of a need for respite from the distractions inherent to the modern web. Its purpose is to provide a new tab alternative that limits decision fatigue for the user while prioritizing a few simple utilities. As my first solo development project, Lavender has also served as a playground for me to grow my code and project management skills.

This project's design was loosely inspired by [Lagom](http://lagom.io).

## Links

- [Chrome Web Store](https://chrome.google.com/webstore/detail/lavender-new-tab/ffobepdbanoiodmfimpmanafepclokbc)
- [GitHub](https://github.com/fvrests/lavender)

## Utilities

- [Vue 3](https://vuejs.org) framework & composition API
- State management with [Vuex](https://vuex.vuejs.org)
- Asynchronous API calls with [OpenWeather API](https://openweathermap.org/)
- User settings sync with [Chrome.storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

## Snippets

### Self-correcting interval

When building the clock for this extension, I planned to set an interval to update the project's internal clock (and avoid repeatedly calling the JS `Date.now()` method).

In researching for this task, I learned that the `setInterval()` method has a tendency to repeat slightly more slowly than expected due to latency, resulting in drift and reliability issues when used for clocks. This correcting interval from a [blog post](https://andrewduthie.com/2013/12/31/creating-a-self-correcting-alternative-to-javascripts-setinterval/) by Andrew Duthie was useful to overcome the latency issue and accurately update the project's stored time.

```js
// correcting interval counteracts compounding variation in time between ticks that would occur using setInterval

export const setCorrectingInterval = (func, delay) => {
	var instance = {};

	// if (init) func()

	function tick(func, delay) {
		if (!instance.started) {
			instance.func = func;
			instance.delay = delay;
			instance.startTime = new Date().valueOf();
			instance.target = delay;
			instance.started = true;

			setTimeout(tick, delay);
		} else {
			var elapsed = new Date().valueOf() - instance.startTime,
				adjust = instance.target - elapsed;

			instance.func();
			instance.target += instance.delay;

			setTimeout(tick, instance.delay + adjust);
		}
	}
	return tick(func, delay);
};
```

### Options menu: click outside to close

Because Lavender's options menu is a modal that overlays the page, it should be easy to dismiss when needed. This snippet achieves that goal using an overlay element which is above the page, but below the modal, and which closes the modal if the user clicks outside of the component.

```html
<!-- overlay -->
<div v-if="isOptionsOpen" class="overlay" @click="toggleOptionsMenu" />

<!-- options menu -->
<div v-show="isOptionsOpen" class="options-menu" role="menu"></div>
```

```js
// toggles the options menu when run
function toggleOptionsMenu() {
	isOptionsOpen.value = !isOptionsOpen.value;
}
```

```css
.options-menu {
	z-index: 10;
}

.overlay {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: transparent;
	/* z-index must be higher than the rest of the content on the page, so that clicking anywhere outside the modal will activate the function, and lower than the modal to prevent interference. I used 9, since my menu is at z=10 and the rest of my page content is at z=0 */
	z-index: 9;
}
```
