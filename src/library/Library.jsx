import Popover from '../ui/Popover';
import Pager from '../ui/Pager';
import { useDragScroll } from '../ui/useDragScroll';
import { navigate, formatDate } from '../lib/hooks';
import { engraving } from '../lib/content';
import './Library.scss';

/*
 * Every post as a card on a sideways shelf, newest first. Swipe, drag, or use
 * prev and next; the counter says which one you're on.
 */
const Library = ({ posts, onClose }) => {
    const track = useDragScroll();

    const open = (e, slug) => {
        e.preventDefault();
        navigate(`/blog/${slug}/`);
    };

    return (
        <Popover label="Blog" onClose={onClose} className="library">
            <header className="library__head">
                <h2 className="mono">
                    Blog <span className="tnum">{String(posts.length).padStart(2, '0')}</span>
                </h2>
            </header>

            <ol className="library__shelf" ref={track.ref} {...track.handlers}>
                {posts.map(post => (
                    <li key={post.slug}>
                        <a className="book" href={`/blog/${post.slug}/`} onClick={e => open(e, post.slug)} draggable="false">
                            <span className={`book__cover ${post.cover ? '' : 'is-engraving'}`} aria-hidden="true">
                                <img
                                    src={post.cover?.src || engraving.src}
                                    alt=""
                                    loading="lazy"
                                    draggable="false"
                                />
                            </span>
                            <span className="book__body">
                                <span className="book__title">{post.title}</span>
                                <span className="book__excerpt">{post.excerpt}</span>
                                <span className="book__foot mono">
                                    <time className="tnum" dateTime={post.date}>{formatDate(post.date)}</time>
                                    <span className="book__read">Read</span>
                                </span>
                            </span>
                        </a>
                    </li>
                ))}
            </ol>

            <Pager track={track} onClose={onClose} />
        </Popover>
    );
};

export default Library;
