import './MiniChart.css';

const MiniChart = ({ data = [], color = '#667eea', height = 40 }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = ((max - value) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="mini-chart" style={{ height: `${height}px` }}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

export default MiniChart;
