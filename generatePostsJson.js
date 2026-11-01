import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const postsDir = path.join(__dirname, 'public/posts');

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

    return {
        title,
        slug,
        path: relativePath,
        date: `${year}-${month}-${day}`,
        excerpt: firstParagraph,
        words,
        minutes: Math.max(1, Math.round(words / 230)),
        cover,
    };
}).sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(path.join(postsDir, 'posts.json'), JSON.stringify(posts, null, 2));

console.log(`✅ posts.json generated (${posts.length} posts)`);
