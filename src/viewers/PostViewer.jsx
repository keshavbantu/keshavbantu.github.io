import { useEffect, useState } from 'react';
import { marked } from 'marked';

const extractTitleAndContent = (markdown) => {
    // Try to extract first heading as title
    const lines = markdown.split('\n');
    let title = '';
    let content = markdown;
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^#\s+(.+)/);
        if (match) {
            title = match[1];
            content = lines.slice(i + 1).join('\n');
            break;
        }
    }
    if (!title) {
        // fallback: first non-empty line
        title = lines.find(line => line.trim() !== '') || '';
        content = lines.slice(1).join('\n');
    }
    return { title, content };
};

const PostViewer = ({ filename, onTitle }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        fetch(`/posts/${filename}.md`)
            .then(res => res.text())
            .then(text => {
                const { title, content } = extractTitleAndContent(text);
                if (onTitle) onTitle(title);
                setContent(marked(content));
            });
    }, [filename, onTitle]);

    return (
        <div className="post" dangerouslySetInnerHTML={{ __html: content }} />
    );
};

export default PostViewer; 