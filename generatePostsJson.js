import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsDir = path.join(__dirname, 'public/posts');
const publicDir = path.join(__dirname, 'public');
const siteUrl = 'https://keshavbantwal.com';

function lastCommittedAt(filepath, fallbackDate) {
    try {
        const relativePath = path.relative(__dirname, filepath);
        const committedAt = execFileSync('git', ['log', '-1', '--format=%cI', '--', relativePath], {
            cwd: __dirname,
            encoding: 'utf8',
        }).trim();
        if (committedAt) return committedAt;
    } catch {
        // Source archives may not contain Git history; the publication date is stable.
    }
    return `${fallbackDate}T00:00:00Z`;
}

const escapeXml = value => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

function walk(dir, filelist = []) {
    for (const file of fs.readdirSync(dir)) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath, filelist);
        } else if (filepath.endsWith('.md')) {
            filelist.push(filepath);
        }
    }
    return filelist;
}

// posts live at public/posts/YYYY/MM/DD/<title>.md
const posts = walk(postsDir).map(p => {
    const relativePath = path.relative(postsDir, p).replace(/\\/g, '/');
    const [year, month, day] = relativePath.split('/');
    const name = path.basename(p, '.md').replace(/-/g, ' ').trim().toLowerCase();
    const slug = name.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // a "# Title" first line sets the title exactly; otherwise it comes from the filename
    const text = fs.readFileSync(p, 'utf8');
    const heading = text.match(/^#\s+(.+)/);
    const title = heading ? heading[1].trim() : name.charAt(0).toUpperCase() + name.slice(1);
    const words = text.split(/\s+/).filter(Boolean).length;
    // the first picture in the post is its cover, in the library and on the reader's first page
    const image = text.match(/!\[([^\]]*)\]\(([^)\s]+)/);
    const cover = image ? { src: image[2], alt: image[1] } : null;
    const firstParagraph = text
        .split(/\n\s*\n/)
        .map(s => s.replace(/^#.*$/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[*_>`]/g, '').trim())
        .find(Boolean) || '';

    const publishedAt = `${year}-${month}-${day}`;

    return {
        title,
        slug,
        path: relativePath,
        date: publishedAt,
        modified: lastCommittedAt(p, publishedAt),
        excerpt: firstParagraph,
        words,
        minutes: Math.max(1, Math.round(words / 230)),
        cover,
        // Placeholder entries stay available to the author without becoming
        // thin, duplicate pages in search or feeds.
        published: !text.includes('This is a placeholder post, here only to show'),
    };
}).filter(post => post.published)
    .map(post => {
        const publishedPost = { ...post };
        delete publishedPost.published;
        return publishedPost;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(path.join(postsDir, 'posts.json'), JSON.stringify(posts, null, 2));

const newestDate = dates => dates
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];
const newestPostModification = newestDate(posts.map(post => post.modified));
const homeModification = newestDate([
    newestPostModification,
    lastCommittedAt(path.join(__dirname, 'index.html'), posts[0]?.date),
    lastCommittedAt(path.join(__dirname, 'src/home/Home.jsx'), posts[0]?.date),
    lastCommittedAt(path.join(__dirname, 'src/lib/content.js'), posts[0]?.date),
]);
const projectsModification = newestDate([
    lastCommittedAt(path.join(__dirname, 'src/projects/Projects.jsx'), posts[0]?.date),
    lastCommittedAt(path.join(__dirname, 'src/lib/content.js'), posts[0]?.date),
]);

const urls = [
    { path: '/', lastmod: homeModification },
    { path: '/blog/', lastmod: newestPostModification },
    { path: '/projects/', lastmod: projectsModification },
    ...posts.map(post => ({ path: `/blog/${post.slug}/`, lastmod: post.modified })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${siteUrl}${url.path}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>
`;

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Keshav Bantwal — Blog</title>
    <link>${siteUrl}/blog/</link>
    <description>Essays on engineering, building, learning, and the systems around us.</description>
    <language>en</language>
    <lastBuildDate>${new Date(posts[0]?.modified || 0).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${posts.map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}/</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'feed.xml'), rss);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`✅ discovery files generated (${posts.length} published posts)`);
