import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeUrls from 'rehype-urls';
import rehypeStringify from 'rehype-stringify';

// todo: maybe use prism theme for codeblocks

// info: https://docs.astro.build/en/guides/rss/
export async function get(context) {
	const parse = (data) =>
		unified()
			.use(remarkParse)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeRaw)
			.use(rehypeUrls, (url, node) => {
				console.log({ url }, { node });
				const baseUrl = import.meta.env.DEV
					? 'http://localhost:3000'
					: context.site.origin;
				return url.href.startsWith('/') ? baseUrl + url.href : url.href;
			})
			.use(rehypeStringify)
			.processSync(data);

	const posts = await getCollection('posts');
	return rss({
		title: 'fvrests',
		description: 'notes from fvrests',
		// info: https://docs.astro.build/en/reference/api-reference/#contextsite
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			title: post.data.title,
			pubDate: post.data.pubDate,
			link: `/notes/${post.slug}/`,
			content: String(parse(post.body)),
		})),
	});
}
