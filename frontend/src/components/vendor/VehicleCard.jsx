import React from 'react';
import { Users, MapPin, Phone, Edit, Trash2 } from 'lucide-react';
import './VehicleCard.css';

const STATUS_LABELS = {
    pending:  'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    inactive: 'Inactive',
};

const VehicleCard = ({ vehicle, onEdit, onDelete }) => {
    const statusLabel = STATUS_LABELS[vehicle.status] ?? 'Pending Approval';

    return (
        <div className="vehicle-card">
            <div className="vehicle-card-header">
                <div>
                    <h3 className="vehicle-name">{vehicle.vehicle_name}</h3>
                    <p className="vehicle-number">{vehicle.vehicle_number}</p>
                </div>
                <span className={`vehicle-status vehicle-status--${vehicle.status}`}>
                    {statusLabel}
                </span>
            </div>

            <div className="vehicle-card-body">
                <div className="vehicle-info-row">
                    <div className="info-item">
                        <Users size={16} />
                        <span>{vehicle.seating_capacity} seats</span>
                    </div>
                    <div className="info-item">
                        <MapPin size={16} />
                        <span>{vehicle.available_location}</span>
                    </div>
                </div>

                <div className="vehicle-info-row">
                    <div className="info-item">
                        <Phone size={16} />
                        <span>{vehicle.contact_number}</span>
                    </div>
                    <div className="vehicle-price">
                        NPR {vehicle.price_per_day.toLocaleString()}/day
                    </div>
                </div>

                {vehicle.description && (
                    <p className="vehicle-description">{vehicle.description}</p>
                )}

                {vehicle.features && (
                    <div className="vehicle-features">
                        {vehicle.features.split(',').map((feature, index) => (
                            <span key={index} className="feature-tag">
                                {feature.trim()}
                            </span>
                        ))}
                    </div>
                )}

                {vehicle.admin_notes && (
                    <div className="admin-notes">
                        <strong>Admin Notes:</strong> {vehicle.admin_notes}
                    </div>
                )}
            </div>

            <div className="vehicle-card-actions">
                <button
                    className="btn-edit"
                    onClick={() => onEdit(vehicle)}
                >
                    <Edit size={16} />
                    Edit
                </button>
                <button
                    className="btn-delete"
                    onClick={() => onDelete(vehicle.id)}
                >
                    <Trash2 size={16} />
                    Delete
                </button>
            </div>
        </div>
    );
};

export default VehicleCard;