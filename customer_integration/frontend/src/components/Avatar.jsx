import { getInitials } from '../utils/formatters';
import './Avatar.css';

const Avatar = ({ name, size = 'md', src, variant = 'gradient' }) => {
    const initials = getInitials(name);

    return (
        <div className={`avatar avatar-${size} avatar-${variant}`}>
            {src ? (
                <img src={src} alt={name} className="avatar-image" />
            ) : (
                <span className="avatar-initials">{initials}</span>
            )}
        </div>
    );
};

export default Avatar;
