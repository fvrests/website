---
title: Lavender
pubDate: 2020-08-19
cover:
  src: ~/assets/lavender/cover.jpg
  alt: Lavender app. Digital time on a pastel purple background reads "10:31 in the evening". Below are the date and weather ("70 / pouring") with a small raincloud icon. The app is atop a dark background with illustrated lavender plants, moon and stars.
tags: ['projects']
---

Lavender is a minimalist Chrome new tab extension born of a need for respite from the distractions inherent to the modern web.

New tab extensions are plentiful in the Chrome ecosystem, but to the protests of my often-restless mind, many I've tried feel like overwhelming conglomerations of links, widgets, search tools, note-taking spaces, and the like.

In 2020, my interactions with these apps launched me into a personal mission to limit my vulnerability to decision fatigue while building a space that prioritizes a few purposeful utilities, and Lavender was born. As my first solo development project, Lavender has also served as a playground for me to grow my code and project management skills.

Lavender's design was loosely inspired by [Lagom](http://lagom.io).

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

When building the extension, I planned to set an interval to update the project's internal clock (and avoid repeatedly calling the JS `Date.now()` method).

In search of internet expertise on this topic, I learned that the `setInterval()` method has a tendency to repeat slightly more slowly than expected due to latency, resulting in drift and reliability issues when used for clocks. This correcting interval from a [blog post](https://andrewduthie.com/2013/12/31/creating-a-self-correcting-alternative-to-javascripts-setinterval/) by Andrew Duthie was useful to overcome the latency issue and accurately update the project's stored time.

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

Because Lavender's options menu is a modal that overlays the page, it should be easy to dismiss when needed (or else risk a peril well-known to online recipe-seekers and hopeful researchers -- <i>"Sign up for our newsletter!"</i> <i>"Whoops! You must have a subscription to continue! >:( "</i>)

This snippet achieves that goal using an overlay element which is above the page, but below the modal, and which closes the modal if the user clicks outside of the component. Of course, relevant packages like [v-click-outside](https://www.npmjs.com/package/v-click-outside) are often used to manage this behavior instead, but they can add some complexity and often rely on a nuanced chain of event-passing that I'm still not quite confident I understand. The below solution is concise and will work for most applications as long as it doesn't interfere with other elements layered in the z-direction.

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
	/* stack level must be above all other content but below the modal, so that clicking anywhere outside the modal will target overlay and call the function. */
	/* since other content is automatically stacked at 0 and we placed the options-menu modal at 10, an index of 9 will place the overlay between them to create the desired behavior.*/
	z-index: 9;
}
```
