import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import { elsewhere, projects, engraving } from './src/lib/content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const postsDir = path.join(__dirname, 'public', 'posts');
const siteUrl = 'https://keshavbantwal.com';

function latestCommittedAt(filepaths) {
    const dates = filepaths.flatMap(filepath => {
        try {
            const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', filepath], {
                cwd: __dirname,
                encoding: 'utf8',
            }).trim();
            return date ? [date] : [];
        } catch {
            return [];
        }
    });
    return dates.sort((a, b) => new Date(b) - new Date(a))[0];
}

const homeModified = latestCommittedAt(['index.html', 'src/home/Home.jsx', 'src/lib/content.js']);
const projectsModified = latestCommittedAt(['src/projects/Projects.jsx', 'src/lib/content.js']);
const author = {
    '@type': 'Person',
    '@id': `${siteUrl}/#keshav-bantwal`,
    name: 'Keshav Bantwal',
    alternateName: ['bantuboi', 'notbantuboi', 'cy3erg33k', 'keshav bantu'],
    url: `${siteUrl}/`,
    jobTitle: 'Software Engineer',
    homeLocation: { '@type': 'Place', name: 'Bengaluru, India' },
    sameAs: elsewhere.map(item => item.url),
};

const escapeHtml = value => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const baseDocument = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const posts = JSON.parse(fs.readFileSync(path.join(postsDir, 'posts.json'), 'utf8'));
const staticStyles = `<style data-static-shell>
.static-shell{max-width:72rem;margin:0 auto;padding:clamp(2rem,7vw,6rem) clamp(1.25rem,5vw,4rem);position:relative;z-index:1}.static-shell header{margin-bottom:3rem}.static-shell h1{font:700 clamp(2.2rem,8vw,6rem)/.95 var(--dots);letter-spacing:-.04em}.static-shell h2{font:600 clamp(1.4rem,3vw,2rem)/1.2 var(--sans);margin:2.5rem 0 1rem}.static-shell p,.static-shell li{max-width:46rem}.static-shell a{text-decoration:underline;text-decoration-color:var(--sodium);text-underline-offset:.2em}.static-shell nav,.static-shell ul{display:flex;flex-wrap:wrap;gap:1rem 1.5rem}.static-shell article{font:400 clamp(1rem,1.5vw,1.15rem)/1.75 var(--book)}.static-shell article p,.static-shell article ul,.static-shell article ol,.static-shell article blockquote{margin:0 0 1.35em}.static-shell article ul,.static-shell article ol{display:block;padding-left:1.25rem}.static-shell .meta{color:var(--dim);font-family:var(--mono);margin:.75rem 0 2.5rem}.static-shell .lede{font-size:1.15rem;color:var(--dim);margin-top:1rem}.static-shell .post-list{display:block}.static-shell .post-list li{margin-bottom:1.5rem}.static-shell .post-list time{display:block;color:var(--dim);font:var(--step-small)/1.5 var(--mono)}
</style>`;

function documentFor({ title, description, canonicalPath, type = 'website', root, schema, publishedTime, modifiedTime }) {
    const canonical = `${siteUrl}${canonicalPath}`;
    const dateMeta = publishedTime ? `
<meta name="date" content="${publishedTime}">
<meta property="article:published_time" content="${publishedTime}">
<meta property="article:modified_time" content="${modifiedTime || publishedTime}">` : '';
    let html = baseDocument
        .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description"[\s\S]*?>/, `<meta name="description" content="${escapeHtml(description)}">`)
        .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}">`)
        .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${type}">`)
        .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}">`)
        .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(title)}">`)
        .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(description)}">`)
        .replace('<meta name="twitter:card" content="summary">', '<meta name="twitter:card" content="summary_large_image">')
        .replace('</head>', `${dateMeta}\n${staticStyles}\n<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>\n</head>`)
        .replace('<div id="root"></div>', `<div id="root">${root}</div>`);
    return html;
}

function writePage(relativePath, html) {
    const directory = path.join(distDir, relativePath);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), html);
}

const postList = `<ol class="post-list">${posts.map(post => `<li><time datetime="${post.date}">${post.date}</time><h2><a href="/blog/${post.slug}/">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt)}</p></li>`).join('')}</ol>`;
const homeRoot = `<main class="static-shell"><header><h1>Keshav Bantwal</h1><p class="lede">Engineer. Builder. Artisan. Essays and projects from Bengaluru.</p></header><nav aria-label="Primary"><a href="/blog/">Blog</a><a href="/projects/">Projects</a><a href="/feed.xml">RSS</a></nav><section aria-labelledby="latest"><h2 id="latest">Latest writing</h2>${postList}</section><section aria-labelledby="elsewhere"><h2 id="elsewhere">Elsewhere</h2><ul>${elsewhere.map(item => `<li><a rel="me" href="${item.url}">${escapeHtml(item.label)} — ${escapeHtml(item.handle)}</a></li>`).join('')}</ul></section></main>`;
const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: 'Keshav Bantwal', inLanguage: 'en', publisher: { '@id': author['@id'] } },
        { '@type': 'ProfilePage', '@id': `${siteUrl}/#profile`, url: `${siteUrl}/`, name: 'Keshav Bantwal — Engineer, builder, and writer', ...(homeModified && { dateModified: homeModified }), mainEntity: author },
    ],
};
fs.writeFileSync(path.join(distDir, 'index.html'), documentFor({
    title: 'Keshav Bantwal — Engineer, Builder & Writer',
    description: 'Keshav Bantwal is a software engineer, builder, and writer in Bengaluru. Read first-person essays on engineering, learning, and systems, and explore shipped projects.',
    canonicalPath: '/',
    root: homeRoot,
    schema: homeSchema,
}));

writePage('blog', documentFor({
    title: 'Blog — Keshav Bantwal',
    description: 'First-person essays by Keshav Bantwal on software engineering, learning, building, and the systems around us.',
    canonicalPath: '/blog/',
    root: `<main class="static-shell"><header><p><a href="/">Keshav Bantwal</a></p><h1>Blog</h1><p class="lede">Essays on engineering, learning, building, and the systems around us.</p></header>${postList}</main>`,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Blog — Keshav Bantwal', url: `${siteUrl}/blog/`, ...(posts[0]?.modified && { dateModified: posts[0].modified }), author },
}));

for (const post of posts) {
    const source = fs.readFileSync(path.join(postsDir, post.path), 'utf8');
    let body = source.replace(/^#\s+.*\n/, '').trimStart();
    if (post.cover) body = body.replace(/^!\[[^\]]*\]\([^)]*\)\s*/, '');
    const image = post.cover?.src || `${siteUrl}${engraving.src}`;
    const canonicalPath = `/blog/${post.slug}/`;
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.modified,
        mainEntityOfPage: `${siteUrl}${canonicalPath}`,
        image,
        wordCount: post.words,
        inLanguage: 'en',
        author,
        publisher: author,
    };
    writePage(path.join('blog', post.slug), documentFor({
        title: `${post.title} — Keshav Bantwal`,
        description: post.excerpt,
        canonicalPath,
        type: 'article',
        publishedTime: post.date,
        modifiedTime: post.modified,
        root: `<main class="static-shell"><p><a href="/blog/">← All essays</a></p><header><h1>${escapeHtml(post.title)}</h1><p class="meta"><time datetime="${post.date}">${post.date}</time> · ${post.minutes} minute read · By <a rel="author" href="/">Keshav Bantwal</a></p></header><article>${marked(body)}</article></main>`,
        schema,
    }));
}

writePage('projects', documentFor({
    title: 'Projects — Keshav Bantwal',
    description: 'Software and web projects built and shipped by Keshav Bantwal.',
    canonicalPath: '/projects/',
    root: `<main class="static-shell"><header><p><a href="/">Keshav Bantwal</a></p><h1>Projects</h1><p class="lede">Things I’ve built and shipped.</p></header><ul>${projects.map(project => `<li><h2>${escapeHtml(project.name)}</h2><p class="meta">${escapeHtml(project.year)}</p><p>${escapeHtml(project.what)}</p><p><a href="${project.url}">${escapeHtml(project.cta)}</a></p></li>`).join('')}</ul></main>`,
    schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Projects — Keshav Bantwal', url: `${siteUrl}/projects/`, ...(projectsModified && { dateModified: projectsModified }), creator: author },
}));

console.log(`✅ prerendered ${posts.length + 3} crawlable HTML pages`);
