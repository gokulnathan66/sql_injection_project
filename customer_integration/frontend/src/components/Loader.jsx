import './Loader.css';

const Loader = ({ size = 'md', variant = 'primary' }) => {
    return (
        <div className={`loader loader-${size} loader-${variant}`}>
            <div className="loader-spinner"></div>
        </div>
    );
};

export default Loader;
