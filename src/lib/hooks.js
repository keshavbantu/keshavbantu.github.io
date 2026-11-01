import { useEffect, useState, useSyncExternalStore } from 'react';

export const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let postsCache = null;

export function usePosts() {
    const [posts, setPosts] = useState(postsCache);
    useEffect(() => {
        if (postsCache) return;
        // revalidate every time, so a newly published post shows up straight away
        fetch('/posts/posts.json', { cache: 'no-cache' })
            .then(res => res.json())
            .then(list => {
                postsCache = list;
                setPosts(list);
            });
    }, []);
    return posts;
}

// routes: '' (home), '#/log' (the library), '#/log/<slug>' (an entry in the reader), '#/projects'
const subscribeHash = cb => {
    window.addEventListener('hashchange', cb);
    return () => window.removeEventListener('hashchange', cb);
};

export function useRoute() {
    const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
    const match = hash.match(/^#\/log\/([\w-]+)/);
    if (match) return { name: 'essay', slug: match[1] };
    if (/^#\/log\/?$/.test(hash)) return { name: 'library' };
    if (hash.startsWith('#/projects')) return { name: 'projects' };
    return { name: 'home' };
}

export function navigate(href) {
    const go = () => {
        if (href === '#' || href === '') {
            history.pushState(null, '', window.location.pathname);
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        } else {
            window.location.hash = href.replace(/^#/, '');
        }
    };
    go();
}

export function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}
