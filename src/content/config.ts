// note: https://github.com/colinhacks/zod

// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

const post = z.object({
	title: z.string(),
	description: z.string().optional(),
	pubDate: z.date().transform((val) => new Date(val)),
	tags: z.array(z.string()),
	cover: z.object({ src: z.string(), alt: z.string() }).optional(),
	links: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
});

// 2. Define your collection(s)
const postCollection = defineCollection({
	schema: post,
});

// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"

export type Post = z.infer<typeof post>;
// to import:
// import type { Post } from '~/content/config';

export const collections = {
	posts: postCollection,
};
