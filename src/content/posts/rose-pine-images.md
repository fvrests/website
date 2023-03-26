---
title: Rosé Pine Images
pubDate: 2021-02-01
cover:
  src: ~/assets/rose-pine-images/cover.jpg
  alt: Screenshot of Rosé Pine images website in a browser window
tags: ['projects', 'rose-pine']
---

Rosé Pine Images is a simple social media preview generator for [Rosé Pine](https://rosepinetheme.com). I adapted this tool from Vercel's [Open Graph Image as a Service](https://github.com/vercel/og-image) in an effort to help foster a common design language among Rosé Pine's diverse projects and ease the process of implementing new themes for creators.

For me, this project was an exercise in adapting a pre-existing codebase to fit a new use case, reading unfamiliar code, and adding my own customizations without compromising existing functionality.

## Links

- [Live Site](https://rose-pine-images.vercel.app)
- [GitHub](https://github.com/fvrests/rose-pine-images)

## Utilities

- Site hosted with [Vercel](https://vercel.com/)
- Spinners from Tobias Ahlin's [Spinkit](https://tobiasahlin.com/spinkit/)

## Templates

Customization options include a selection of three basic themes, as well as an input for the app name (shown here: `YOUR APP`).

### Rosé Pine

<img src="/rose-pine-images/rpi-preview-base.jpg" alt="Social banner reading 'Rosé Pine / YOUR APP'. The text is surrounded by blue-green, pale pink and eggshell colored ZZ plants, monstera and succulents atop a dark indigo background." width="350"/>

### Rosé Pine Moon

<img src="/rose-pine-images/rpi-preview-moon.jpg"  alt="Social banner reading 'Rosé Pine / YOUR APP'. The text is surrounded by blue-green, bright yellow, salmon and lavender colored ZZ plants, monstera and succulents atop a dark indigo, starry background with a crescent moon." width="350"/>

### Rosé Pine Dawn

<img src="/rose-pine-images/rpi-preview-dawn.jpg"  alt="Social banner reading 'Rosé Pine / YOUR APP'. The text is surrounded by blue-green, golden yellow, salmon and lavender colored ZZ plants, monstera and succulents atop a warm oat colored background with a pale yellow sun." width="350"/>

## Snippets

Because the image preview in this project takes a moment to generate, I wanted to add some sort of animation in its place to signal a loading state and visually fill the space where the image would appear. I had come across [Spinkit](https://tobiasahlin.com/spinkit/) and knew one of the lightweight, monochromatic spinners would be perfect for the site.

The code below shows the demonstrated implementation from Spinkit, which looked simple to add to a typical codebase.

```html
<div class="spinner">
	<div class="bounce1"></div>
	<div class="bounce2"></div>
	<div class="bounce3"></div>
</div>
```

Unfortunately, I think you can predict that it turned out not to be so simple. I realized that in my case, the component would need to be rendered in the `frontend input` section of the site, which is imported through a `script` tag and mostly composed of code that looks like this:

```ts
return H(
	'div',
	{ className: 'stack' },
	H(
		'div',
		H(
			'div',
			H(Field, {
				label: 'Theme',
				input: H(Dropdown, {
					options: themeOptions,
					value: theme,
					onchange: (val: Theme) => {
						setLoadingState({ theme: val });
					},
				}),
			})
		)
	)
);
```

Despite feeling unfamiliar with (and slightly disturbed by) the syntax of the file, I was able to piece together what I knew about HTML and the lower level semantics above to produce this section, which creates the desired element.

```ts
H(
	'div',
	{ className: 'spinkit' },
	H(
		'div',
		{ className: 'spinner' },
		H('div', { className: 'bounce1' }),
		H('div', { className: 'bounce2' }),
		H('div', { className: 'bounce3' })
	)
);
```

All that was left was to add the provided styles to the public `style.css` file and ensure that they targeted the `className` values I assigned, and the rest worked as intended.

While this code block looks different than the example found in Spinkit's source code, writing it turned out to be a reasonable task once I understood how the surrounding structure was analogous to HTML I'd seen before. This experience taught me to search for clues in the hierarchy, language & layout of code, even when the syntax I might have written myself doesn't seem apparent.
