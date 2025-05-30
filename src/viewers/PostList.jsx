import { useEffect, useState } from 'react';
import './PostList.scss';

const PostList = ({ onSelect }) => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        fetch('/posts/posts.json')
            .then(res => res.json())
            .then(async (list) => {
                const withPreview = await Promise.all(
                    list.map(async (post) => {
                        const res = await fetch(`/posts/${post.path}`);
                        const text = await res.text();
                        const clean = text.replace(/[#>*_\-`]/g, '');
                        const preview = clean.split('\n').slice(0, 4).join(' ').slice(0, 200);
                        return { ...post, preview };
                    })
                );
                setPosts(withPreview);
            });
    }, []);

    return (
        <div className="post-list">
            <ul>
                {posts.map((post) => {
                    const dateParts = post.path.split('/');
                    const date = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
                    return (
                        <li key={post.path} className="post-item">
                            <button onClick={() => onSelect({ path: post.path, title: post.title, date })}>
                                <span className="post-date">{date}</span>
                                <span className="post-title">{post.title}</span>
                                <span className="post-preview">{post.preview}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default PostList;
