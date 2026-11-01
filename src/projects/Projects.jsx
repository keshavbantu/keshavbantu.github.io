import Popover from '../ui/Popover';
import Pager from '../ui/Pager';
import { useDragScroll } from '../ui/useDragScroll';
import { projects } from '../lib/content';
import './Projects.scss';

// a row of cards you swipe or drag sideways; the last card is the next project
const Projects = ({ onClose }) => {
    const track = useDragScroll();

    return (
        <Popover label="Projects" onClose={onClose} className="projects">
            <header className="projects__head">
                <h2 className="mono">Projects</h2>
                <p>Things I’ve built and shipped. Swipe through.</p>
            </header>

            <ul className="projects__track" ref={track.ref} {...track.handlers}>
                {projects.map(p => (
                    <li className="card" key={p.name}>
                        <div className="card__art card__art--dots" aria-hidden="true">
                            <span className="card__mark">KB</span>
                        </div>
                        <div className="card__body">
                            <p className="card__meta mono tnum">{p.year}</p>
                            <h3>{p.name}</h3>
                            <p>{p.what}</p>
                            <a className="chip" href={p.url} target="_blank" rel="noreferrer">{p.cta}</a>
                        </div>
                    </li>
                ))}
                <li className="card card--next">
                    <div className="card__art card__art--empty" aria-hidden="true" />
                    <div className="card__body">
                        <p className="card__meta mono">In progress</p>
                        <h3>Next project<span className="caret" aria-hidden="true" /></h3>
                        <p>Being built. It lands here when it ships.</p>
                    </div>
                </li>
            </ul>

            <Pager track={track} onClose={onClose} />
        </Popover>
    );
};

export default Projects;
