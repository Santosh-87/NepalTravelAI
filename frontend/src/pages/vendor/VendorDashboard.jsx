import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import Stats from '../../components/vendor/Stats';
import VehicleCard from '../../components/vendor/VehicleCard';
import marketplaceService from '../../services/marketplace';
import { Link } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import './VendorDashboard.css';

const VendorDashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [vehiclesData, bookingsData] = await Promise.all([
                marketplaceService.getMyVehicles(),
                marketplaceService.getMyBookings()
            ]);

            setVehicles(vehiclesData);
            setBookings(bookingsData);
            setError('');
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) {
            return;
        }

        try {
            await marketplaceService.deleteVehicle(id);
            setVehicles(vehicles.filter(v => v.id !== id));
        } catch (err) {
            alert('Failed to delete vehicle');
        }
    };

    if (loading) {
        return (
            <VendorLayout>
                <div className="loading-state">Loading...</div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <Link to="/vendor/add-vehicle" className="btn-primary">
                    <Plus size={20} />
                    Add Vehicle
                </Link>
            </div>

            {error && (
                <div className="error-banner">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <Stats vehicles={vehicles} bookings={bookings} />

            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Recent Vehicles</h2>
                    <Link to="/vendor/listings">View All</Link>
                </div>

                {vehicles.length === 0 ? (
                    <div className="empty-state">
                        <p>No vehicles yet</p>
                        <Link to="/vendor/add-vehicle" className="btn-primary">
                            Add Your First Vehicle
                        </Link>
                    </div>
                ) : (
                    <div className="vehicles-grid">
                        {vehicles.slice(0, 3).map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onEdit={() => { }}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Recent Bookings</h2>
                    <Link to="/vendor/bookings">View All</Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <p>No bookings yet</p>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {bookings.slice(0, 3).map(booking => (
                            <div key={booking.id} className="booking-item">
                                <div>
                                    <strong>{booking.vehicle_name}</strong>
                                    <p>{booking.tourist_name}</p>
                                </div>
                                <div className="booking-status">
                                    {booking.status}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default VendorDashboard;