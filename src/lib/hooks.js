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

// Real paths give every page a distinct crawlable URL. The generated static HTML
// makes direct requests work on GitHub Pages; history navigation keeps the app fast.
const subscribeLocation = cb => {
    window.addEventListener('popstate', cb);
    window.addEventListener('site:navigate', cb);
    return () => {
        window.removeEventListener('popstate', cb);
        window.removeEventListener('site:navigate', cb);
    };
};

export function useRoute() {
    const pathname = useSyncExternalStore(subscribeLocation, () => window.location.pathname);
    const match = pathname.match(/^\/blog\/([\w-]+)\/?$/);
    if (match) return { name: 'essay', slug: match[1] };
    if (/^\/blog\/?$/.test(pathname)) return { name: 'library' };
    if (/^\/projects\/?$/.test(pathname)) return { name: 'projects' };
    return { name: 'home' };
}

export function navigate(href) {
    history.pushState(null, '', href || '/');
    window.dispatchEvent(new Event('site:navigate'));
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
