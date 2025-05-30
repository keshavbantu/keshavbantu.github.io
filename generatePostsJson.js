import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath, filelist);
        } else if (filepath.endsWith('.md')) {
            filelist.push(filepath);
        }
    });
    return filelist;
}

const posts = walk(path.join(__dirname, 'public/posts')).map(p => {
    const relativePath = p.replace(/^.*public\/posts\//, '').replace(/\\/g, '/');
    const title = path.basename(p, '.md')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    return { title, path: relativePath };
});

fs.writeFileSync(
    path.join(__dirname, 'public/posts/posts.json'),
    JSON.stringify(posts, null, 2)
);

console.log('✅ posts.json generated');
