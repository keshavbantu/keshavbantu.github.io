import {
    IoMusicalNotesOutline,
    IoLogoTwitter,
    IoLogoLinkedin,
    IoLogoGithub,
    IoLogoInstagram,
    IoLogoReddit,
    IoBarChartOutline,
    IoGlobeOutline,
} from 'react-icons/io5';
import { TbFileFilled } from 'react-icons/tb';

import './Links.scss';

const allLinks = [
    {
        label: 'Linkedin',
        url: 'https://www.linkedin.com/in/keshavbantu2',
        icon: <IoLogoLinkedin size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Twitter',
        url: 'https://x.com/cy3erg33k',
        icon: <IoLogoTwitter size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Instagram',
        url: 'https://www.instagram.com/bantuboi',
        icon: <IoLogoInstagram size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Github',
        url: 'https://github.com/keshavbantu',
        icon: <IoLogoGithub size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Reddit',
        url: 'https://www.reddit.com/u/cy3erg33k',
        icon: <IoLogoReddit size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Stack-O',
        url: 'https://stackoverflow.com/users/9148332/keshav-bantu?tab=profile',
        icon: <IoBarChartOutline size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Playlists',
        url: 'https://music.youtube.com/channel/UCkRemvyfCFuKjhiWMupqguw',
        icon: <IoMusicalNotesOutline size={16} style={{ marginRight: '4px' }} />,
    },
    {
        label: 'Quora',
        url: 'https://quora.com/profile/Keshav-Bantu',
        icon: <IoGlobeOutline size={16} style={{ marginRight: '4px' }} />,
    },
];

const Links = () => {
    return (
        <div className="links-container">
            <a
                href="resume.pdf"
                className="chip-padded"
                target="_blank"
                rel="noopener noreferrer"
            >
                <TbFileFilled size={16} style={{ marginRight: '4px' }} />
                Resume
            </a>
            <div className="chip-grid">
                {allLinks.map((item, idx) => (
                    <a
                        href={item.url}
                        className="chip"
                        key={idx}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {item.icon}
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Links;
