import { useEffect, useState } from 'react';
import Wordmark from './Wordmark';
import { usePosts, navigate } from '../lib/hooks';
import { elsewhere } from '../lib/content';
import './Home.scss';

const bengaluruTime = () =>
    new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
    });

const Clock = () => {
    const [time, setTime] = useState(bengaluruTime);
    useEffect(() => {
        const id = setInterval(() => setTime(bengaluruTime()), 10_000);
        return () => clearInterval(id);
    }, []);
    return <span className="tnum">{time}</span>;
};

const logDate = iso => iso.replaceAll('-', '.');

const Home = ({ onPoint }) => {
    const posts = usePosts() || [];
    const latest = posts[0];
    const open = (e, href) => {
        e.preventDefault();
        navigate(href);
    };

    return (
        <main className="home">
            <header className="home__id">
                <h1 aria-label="Keshav Bantwal">
                    <Wordmark lines={['KESHAV', 'BANTWAL']} decorative={false} />
                </h1>
                <p className="home__alias mono">
                    <span>[alias]</span> bantuboi · notbantuboi · cy3erg33k · keshav bantu
                </p>
                <p className="home__tag mono">
                    <span>&lt;</span> Engineer. Builder. Artisan. <span>/&gt;</span>
                </p>
            </header>

            <nav className="home__nav" aria-label="Sections">
                <a className="chip" href="#/projects" onClick={e => open(e, '#/projects')}>
                    <span className="pix" aria-hidden="true"><i /><i /><i /><i /></span>
                    Projects
                </a>
            </nav>

            <section className="home__log" aria-labelledby="log-h">
                <h2 id="log-h" className="home__label mono">Latest</h2>
                {latest && (
                    <a
                        className="entry"
                        href={`#/log/${latest.slug}`}
                        onClick={e => open(e, `#/log/${latest.slug}`)}
                        onPointerEnter={() => onPoint(posts.length - 1)}
                        onPointerLeave={() => onPoint(null)}
                        onFocus={() => onPoint(posts.length - 1)}
                        onBlur={() => onPoint(null)}
                    >
                        <span className="entry__date mono tnum">
                            <time dateTime={latest.date}>{logDate(latest.date)}</time>
                            <span>{latest.minutes} min</span>
                        </span>
                        <span className="entry__title">{latest.title}</span>
                        <span className="entry__excerpt">{latest.excerpt}</span>
                    </a>
                )}
                <a className="chip home__library" href="#/log" onClick={e => open(e, '#/log')}>
                    <span className="pix" aria-hidden="true"><i /><i /><i /><i /></span>
                    Blog
                    <span className="home__count tnum">{String(posts.length).padStart(2, '0')}</span>
                </a>
            </section>

            <section className="home__links" aria-labelledby="links-h">
                <h2 id="links-h" className="home__label mono">Elsewhere</h2>
                <ul>
                    {elsewhere.map(item => (
                        <li key={item.label}>
                            <a href={item.url} target="_blank" rel="noreferrer">
                                <span className="home__dot" aria-hidden="true" />
                                {item.label}
                                <span className="home__handle mono">{item.handle}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </section>

            <footer className="home__bar mono">
                <p className="home__cell">Bengaluru <Clock /> IST</p>
                <p className="home__cell home__cell--motto">The brave shall inherit the earth</p>
            </footer>
        </main>
    );
};

export default Home;
