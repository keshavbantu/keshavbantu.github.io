import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import Popover, { CornerNav } from '../ui/Popover';
import { engraving } from '../lib/content';
import { formatDate } from '../lib/hooks';
import './Reader.scss';

/*
 * The essay, read by scrolling. On wide screens the cover (picture, title,
 * date) stays put on the left while the text scrolls past it; on phones the
 * cover comes first and the text follows. The line under the header fills as
 * you read.
 */
const Reader = ({ post, onClose, onBack }) => {
    const [html, setHtml] = useState('');
    const [read, setRead] = useState(0);
    const scrollRef = useRef(null);

    useEffect(() => {
        document.title = `${post.title} · Keshav Bantwal`;
        fetch(`/posts/${post.path}`)
            .then(res => res.text())
            .then(text => {
                let body = text.replace(/^#\s+.*\n/, '').trimStart();
                if (post.cover) body = body.replace(/^!\[[^\]]*\]\([^)]*\)\s*/, '');
                setHtml(marked(body));
            });
        return () => {
            document.title = 'Keshav Bantwal';
        };
    }, [post]);

    // keyboard scrolling works straight away, without clicking into the text first
    useEffect(() => {
        scrollRef.current?.focus({ preventScroll: true });
    }, [html]);

    const onScroll = e => {
        const el = e.currentTarget;
        const max = el.scrollHeight - el.clientHeight;
        setRead(max > 0 ? Math.min(1, el.scrollTop / max) : 1);
    };

    return (
        <Popover label={post.title} onClose={onClose} onEscape={onBack} className="reader">
            <header className="reader__head mono">
                <span className="reader__title">{post.title}</span>
                <span className="tnum">{Math.round(read * 100)}%</span>
                <span className="reader__progress" style={{ transform: `scaleX(${read})` }} aria-hidden="true" />
            </header>

            <div className="reader__scroll" ref={scrollRef} tabIndex={-1} onScroll={onScroll}>
                <div className="reader__layout">
                    <section className="reader__cover">
                        <figure className={`reader__plate ${post.cover ? '' : 'is-engraving'}`}>
                            <img src={post.cover?.src || engraving.src} alt={post.cover?.alt || engraving.alt} />
                        </figure>
                        <h1>{post.title}</h1>
                        <p className="mono">
                            <time dateTime={post.date}>{formatDate(post.date)}</time>, {post.minutes} minute read
                        </p>
                        {!post.cover && (
                            <p className="reader__credit mono">
                                {engraving.caption}{' '}
                                <a href={engraving.source} target="_blank" rel="noreferrer">{engraving.credit}</a>
                            </p>
                        )}
                    </section>
                    <div className="reader__column">
                        <article className="reader__text" dangerouslySetInnerHTML={{ __html: html }} />
                        <p className="reader__end mono">End of entry.</p>
                    </div>
                </div>
            </div>

            <footer className="reader__foot">
                <CornerNav onBack={onBack} onClose={onClose} backLabel="Back to the blog" />
            </footer>
        </Popover>
    );
};

export default Reader;
