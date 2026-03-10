import React from 'react';
import { Car, Calendar, CheckCircle, Clock } from 'lucide-react';
import './Stats.css';

const Stats = ({ vehicles, bookings }) => {
  const stats = [
    {
      icon: Car,
      label: 'Total Vehicles',
      value: vehicles.length,
      color: '#667eea'
    },
    {
      icon: CheckCircle,
      label: 'Approved',
      value: vehicles.filter(v => v.status === 'approved').length,
      color: '#28a745'
    },
    {
      icon: Clock,
      label: 'Pending',
      value: vehicles.filter(v => v.status === 'pending').length,
      color: '#ffc107'
    },
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: bookings.length,
      color: '#17a2b8'
    }
  ];
  
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div 
            className="stat-icon"
            style={{ background: `${stat.color}15`, color: stat.color }}
          >
            <stat.icon size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;