import { Car, Calendar, TrendingUp, Clock } from 'lucide-react';
import './Stats.css';

const formatCurrency = (n) => `NPR ${Number(n).toLocaleString()}`;

const buildStats = (vehicles, bookings) => {
    const earningBookings = bookings.filter(
        b => b.status === 'confirmed' || b.status === 'completed'
    );
    const revenue = earningBookings.reduce(
        (sum, b) => sum + Number(b.total_price || 0),
        0
    );

    return [
        {
            Icon: Car,
            label: 'Total Vehicles',
            value: vehicles.length,
            sub: `${vehicles.filter(v => v.status === 'approved').length} approved · ${vehicles.filter(v => v.status === 'pending').length} pending`,
            cls: 'blue',
        },
        {
            Icon: TrendingUp,
            label: 'Total Revenue',
            value: formatCurrency(revenue),
            sub: 'confirmed & completed bookings',
            cls: 'green',
        },
        {
            Icon: Calendar,
            label: 'Total Bookings',
            value: bookings.length,
            sub: `${bookings.filter(b => b.status === 'confirmed').length} confirmed · ${bookings.filter(b => b.status === 'completed').length} completed`,
            cls: 'teal',
        },
        {
            Icon: Clock,
            label: 'Pending Bookings',
            value: bookings.filter(b => b.status === 'pending').length,
            sub: 'Awaiting your response',
            cls: 'gold',
        },
    ];
};

const Stats = ({ vehicles, bookings }) => (
    <div className="vnd-stat-grid">
        {buildStats(vehicles, bookings).map(({ Icon, label, value, sub, cls }) => (
            <div key={label} className={`vnd-stat-card vnd-stat-card--${cls}`}>
                <div className="vnd-stat-icon">
                    <Icon size={22} />
                </div>
                <div className="vnd-stat-body">
                    <div className="vnd-stat-value">{value}</div>
                    <div className="vnd-stat-label">{label}</div>
                    <div className="vnd-stat-sub">{sub}</div>
                </div>
            </div>
        ))}
    </div>
);

export default Stats;
