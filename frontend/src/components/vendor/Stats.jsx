import { Car, Calendar, CheckCircle, Clock } from 'lucide-react';
import './Stats.css';

const buildStats = (vehicles, bookings) => [
    {
        Icon: Car,
        label: 'Total Vehicles',
        value: vehicles.length,
        sub: `${vehicles.filter(v => v.status === 'approved').length} approved`,
        cls: 'blue',
    },
    {
        Icon: CheckCircle,
        label: 'Approved',
        value: vehicles.filter(v => v.status === 'approved').length,
        sub: 'Active listings',
        cls: 'green',
    },
    {
        Icon: Clock,
        label: 'Pending Review',
        value: vehicles.filter(v => v.status === 'pending').length,
        sub: 'Awaiting admin approval',
        cls: 'gold',
    },
    {
        Icon: Calendar,
        label: 'Total Bookings',
        value: bookings.length,
        sub: `${bookings.filter(b => b.status === 'pending').length} pending`,
        cls: 'teal',
    },
];

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
