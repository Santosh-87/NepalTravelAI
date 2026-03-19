import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import marketplaceService from '../../services/marketplace';
import { ArrowLeft, Plus, X, Upload, ImageIcon } from 'lucide-react';
import './AddVehicle.css';

const AddVehicle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    vehicle_type: 'car',
    vehicle_name: '',
    vehicle_number: '',
    seating_capacity: '',
    price_per_day: '',
    description: '',
    available_location: '',
    contact_number: '',
  });

  const [features, setFeatures] = useState(['']);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const vehicleTypes = [
    { value: 'car', label: 'Car' },
    { value: 'suv', label: 'SUV' },
    { value: 'hiace', label: 'Hiace/Van' },
    { value: 'coaster', label: 'Coaster' },
    { value: 'bus', label: 'Bus' },
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };
  
  const handleFeatureChange = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  
  const addFeature = () => {
    setFeatures([...features, '']);
  };
  
  const removeFeature = (index) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures.length > 0 ? newFeatures : ['']);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Filter out empty features
      const validFeatures = features.filter(f => f.trim() !== '');

      const vehicleData = {
        ...formData,
        seating_capacity: parseInt(formData.seating_capacity),
        price_per_day: parseFloat(formData.price_per_day),
        features_list: validFeatures,
        primary_image: imageFile,
      };

      await marketplaceService.createVehicle(vehicleData);
      
      // Redirect to listings
      navigate('/vendor/listings');
      
    } catch (err) {
      setError(err.message || 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <VendorLayout>
      <div className="add-vehicle-page">
        <div className="page-header">
          <button 
            className="back-button"
            onClick={() => navigate('/vendor/dashboard')}
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Add New Vehicle</h1>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="vehicle-form">
          {/* Vehicle Type */}
          <div className="form-section">
            <h3>Vehicle Information</h3>
            
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleChange}
                required
              >
                {vehicleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Name *</label>
                <input
                  type="text"
                  name="vehicle_name"
                  placeholder="e.g., Toyota Hiace 2020"
                  value={formData.vehicle_name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Vehicle Number *</label>
                <input
                  type="text"
                  name="vehicle_number"
                  placeholder="e.g., BA 1 KHA 1234"
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Seating Capacity *</label>
                <input
                  type="number"
                  name="seating_capacity"
                  min="1"
                  placeholder="e.g., 10"
                  value={formData.seating_capacity}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Price per Day (NPR) *</label>
                <input
                  type="number"
                  name="price_per_day"
                  min="0"
                  step="100"
                  placeholder="e.g., 8000"
                  value={formData.price_per_day}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe your vehicle, condition, special features..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          {/* Features */}
          <div className="form-section">
            <h3>Features</h3>
            
            <div className="features-list">
              {features.map((feature, index) => (
                <div key={index} className="feature-input-group">
                  <input
                    type="text"
                    placeholder="e.g., AC, GPS, Music System"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      className="remove-feature-btn"
                      onClick={() => removeFeature(index)}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              className="add-feature-btn"
              onClick={addFeature}
            >
              <Plus size={18} />
              Add Feature
            </button>
          </div>
          
          {/* Location & Contact */}
          <div className="form-section">
            <h3>Location & Contact</h3>
            
            <div className="form-group">
              <label>Available Location *</label>
              <input
                type="text"
                name="available_location"
                placeholder="e.g., Kathmandu, Pokhara"
                value={formData.available_location}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="contact_number"
                placeholder="e.g., 9841234567"
                value={formData.contact_number}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Vehicle Image (optional)</label>
              <div className="image-upload-area">
                {imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                    <button type="button" className="remove-image-btn" onClick={removeImage}>
                      <X size={16} /> Remove
                    </button>
                  </div>
                ) : (
                  <label htmlFor="vehicle-image" className="image-drop-zone">
                    <ImageIcon size={36} className="upload-icon" />
                    <span className="upload-text">Click to upload an image</span>
                    <span className="upload-hint">JPG, PNG, WEBP up to 5MB</span>
                  </label>
                )}
                <input
                  type="file"
                  id="vehicle-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input-hidden"
                />
                {imagePreview && (
                  <label htmlFor="vehicle-image" className="change-image-btn">
                    <Upload size={14} /> Change Image
                  </label>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/vendor/dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
};

export default AddVehicle;