import './Card.css';

const Card = ({
    children,
    className = '',
    variant = 'default',
    hoverable = false,
    onClick,
    ...props
}) => {
    const classes = [
        'card',
        `card-${variant}`,
        hoverable && 'card-hoverable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
};

export default Card;
