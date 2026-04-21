import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import VehicleCard from '../../components/vendor/VehicleCard';
import marketplaceService from '../../services/marketplace';
import { Plus, Filter, Search, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/shared/ConfirmModal';
import './MyListings.css';

const MyListings = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modal, setModal] = useState(null);

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        filterVehicles();
    }, [vehicles, searchTerm, statusFilter]);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getMyVehicles();
            setVehicles(data);
        } catch (err) {
            console.error('Failed to load vehicles:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterVehicles = () => {
        let filtered = [...vehicles];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(v =>
                v.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(v => v.status === statusFilter);
        }

        setFilteredVehicles(filtered);
    };

    const handleDelete = (id) => {
        setModal({
            title: 'Delete Vehicle?',
            message: 'This will permanently remove this vehicle listing and cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
            icon: <Trash2 size={21} />,
            onConfirm: async () => {
                setModal(null);
                try {
                    await marketplaceService.deleteVehicle(id);
                    setVehicles(prev => prev.filter(v => v.id !== id));
                } catch (err) {
                    alert('Failed to delete vehicle');
                }
            },
        });
    };

    const handleEdit = (vehicle) => {
        navigate(`/vendor/edit-vehicle/${vehicle.id}`);
    };

    if (loading) {
        return (
            <VendorLayout>
                <div className="loading-state">Loading vehicles...</div>
            </VendorLayout>
        );
    }

    return (
        <VendorLayout>
            {modal && (
                <ConfirmModal
                    {...modal}
                    onCancel={() => setModal(null)}
                />
            )}
            <div className="listings-page">
                <div className="listings-header">
                    <div>
                        <h1>My Vehicles</h1>
                        <p className="listings-subtitle">
                            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/vendor/add-vehicle')}
                    >
                        <Plus size={20} />
                        Add Vehicle
                    </button>
                </div>

                {/* Filters */}
                <div className="listings-filters">
                    <div className="search-box">
                        <Search size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <Filter size={18} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Vehicles Grid */}
                {filteredVehicles.length === 0 ? (
                    <div className="empty-state">
                        {vehicles.length === 0 ? (
                            <>
                                <p>You haven't added any vehicles yet</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/vendor/add-vehicle')}
                                >
                                    <Plus size={20} />
                                    Add Your First Vehicle
                                </button>
                            </>
                        ) : (
                            <p>No vehicles match your filters</p>
                        )}
                    </div>
                ) : (
                    <div className="vehicles-grid">
                        {filteredVehicles.map(vehicle => (
                            <VehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </VendorLayout>
    );
};

export default MyListings;