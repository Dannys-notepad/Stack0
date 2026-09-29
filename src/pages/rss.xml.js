import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../data/site.json';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: site.title,
    description: site.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: [post.data.category, ...post.data.tags]
    })),
    customData: `<language>en-us</language>`
  });
}