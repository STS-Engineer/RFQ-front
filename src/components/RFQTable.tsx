// components/RFQTable.tsx
import React, { useState, useEffect } from 'react';
import { RFQ } from '../types/rfq.ts';
import RFQModal from './RFQModal.tsx';
import './RFQTable.css';

const RFQTable: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    rfq_id: '',
    customer_name: '',
    created_by_email: '',  
    product_line: '',
    customer_pn: '',
    annual_volume_min: '',
    annual_volume_max: '',
    target_price_min: '',
    target_price_max: ''
  });

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      const response = await fetch('https://rfq-back.azurewebsites.net/ajouter/rfq');
      const data = await response.json();
      setRfqs(data);
    } catch (error) {
      console.error('Error fetching RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setIsModalOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      rfq_id: '',
      customer_name: '',
      created_by_email: '',
      product_line: '',
      customer_pn: '',
      annual_volume_min: '',
      annual_volume_max: '',
      target_price_min: '',
      target_price_max: ''
    });
    setSearchTerm('');
  };

  const filteredRfqs = rfqs.filter(rfq => {
    // Global search
    const matchesSearch = searchTerm === '' || 
      rfq.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.created_by_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.customer_pn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.product_line.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfq.rfq_id.toString().includes(searchTerm) ||
      rfq.contact_email.toLowerCase().includes(searchTerm.toLowerCase());

    // Column-specific filters
    const matchesRfqId = filters.rfq_id === '' || rfq.rfq_id.toString().includes(filters.rfq_id);
    const matchesCustomerName = filters.customer_name === '' || 
      rfq.customer_name.toLowerCase().includes(filters.customer_name.toLowerCase());
    const matchesProductLine = filters.product_line === '' || 
      rfq.product_line.toLowerCase().includes(filters.product_line.toLowerCase());
    const matchesCustomerPn = filters.customer_pn === '' || 
      rfq.customer_pn.toLowerCase().includes(filters.customer_pn.toLowerCase());
    
    // Numeric range filters
    const matchesAnnualVolumeMin = filters.annual_volume_min === '' || 
      rfq.annual_volume >= parseInt(filters.annual_volume_min || '0');
    const matchesAnnualVolumeMax = filters.annual_volume_max === '' || 
      rfq.annual_volume <= parseInt(filters.annual_volume_max || '999999999');
    
    const matchesTargetPriceMin = filters.target_price_min === '' || 
      (rfq.target_price_eur && rfq.target_price_eur >= parseInt(filters.target_price_min || '0'));
    const matchesTargetPriceMax = filters.target_price_max === '' || 
      (rfq.target_price_eur && rfq.target_price_eur <= parseInt(filters.target_price_max || '999999999'));

    return matchesSearch && 
           matchesRfqId && 
           matchesCustomerName && 
           matchesProductLine && 
           matchesCustomerPn && 
           matchesAnnualVolumeMin && 
           matchesAnnualVolumeMax && 
           matchesTargetPriceMin && 
           matchesTargetPriceMax;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: string } = {
      'pending': 'status-badge pending',
      'approved': 'status-badge approved',
      'rejected': 'status-badge rejected',
      'in_review': 'status-badge in-review',
      'completed': 'status-badge completed'
    };
    return statusConfig[status] || 'status-badge';
  };

  const getUniqueProductLines = () => {
    return Array.from(new Set(rfqs.map(rfq => rfq.product_line))).filter(Boolean).sort();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading RFQs...</p>
      </div>
    );
  }

  return (
    <div className="rfq-container">
      <div className="rfq-header">
        <h1>RFQ Management</h1>
       
      </div>

      {/* Always Visible Filters Panel */}
      <div className="filters-panel">
        <div className="filters-header">
          <h3>Filter RFQs</h3>
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
        
        <div className="filters-grid">
          {/* Row 1: Basic Filters */}
          <div className="filter-group">
            <label htmlFor="rfq-id-filter">RFQ ID</label>
            <input
              id="rfq-id-filter"
              type="text"
              placeholder="Filter by ID..."
              value={filters.rfq_id}
              onChange={(e) => handleFilterChange('rfq_id', e.target.value)}
              className="filter-input"
            />
             
          </div>
          <div className="filter-group">
            <label htmlFor="created_by_email-filter">Requester</label>
            <input
              id="created_by_email-filter"
              type="text"
              placeholder="Filter by created_by_email..."
              value={filters.created_by_email}
              onChange={(e) => handleFilterChange('created_by_email', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="customer-filter">Customer</label>
            <input
              id="customer-filter"
              type="text"
              placeholder="Filter by customer..."
              value={filters.customer_name}
              onChange={(e) => handleFilterChange('customer_name', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="product-line-filter">Product Line</label>
            <select
              id="product-line-filter"
              value={filters.product_line}
              onChange={(e) => handleFilterChange('product_line', e.target.value)}
              className="filter-select"
            >
              <option value="">All Product Lines</option>
              {getUniqueProductLines().map(line => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="customer-pn-filter">Customer PN</label>
            <input
              id="customer-pn-filter"
              type="text"
              placeholder="Filter by part number..."
              value={filters.customer_pn}
              onChange={(e) => handleFilterChange('customer_pn', e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Row 2: Volume and Price with spacing */}
          <div className="filter-group volume-filter">
            <label>Annual Volume</label>
            <div className="range-filter-group">
              <input
                type="number"
                placeholder="Min volume"
                value={filters.annual_volume_min}
                onChange={(e) => handleFilterChange('annual_volume_min', e.target.value)}
                className="range-input"
                min="0"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                placeholder="Max volume"
                value={filters.annual_volume_max}
                onChange={(e) => handleFilterChange('annual_volume_max', e.target.value)}
                className="range-input"
                min="0"
              />
            </div>
          </div>

          {/* Spacer column */}
          <div className="filter-spacer"></div>

          <div className="filter-group price-filter">
            <label>Target Price (€)</label>
            <div className="range-filter-group">
              <input
                type="number"
                placeholder="Min price"
                value={filters.target_price_min}
                onChange={(e) => handleFilterChange('target_price_min', e.target.value)}
                className="range-input"
                min="0"
                step="0.01"
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                placeholder="Max price"
                value={filters.target_price_max}
                onChange={(e) => handleFilterChange('target_price_max', e.target.value)}
                className="range-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="active-filters">
          <span className="active-filters-label">Active Filters:</span>
          {filters.rfq_id && (
            <span className="filter-tag">
              RFQ ID: {filters.rfq_id} 
              <button onClick={() => handleFilterChange('rfq_id', '')}>×</button>
            </span>
          )}

           {filters.created_by_email && (
            <span className="filter-tag">
              Requester: {filters.created_by_email}
              <button onClick={() => handleFilterChange('created_by_email', '')}>×</button>
            </span>
          )}
          
          {filters.customer_name && (
            <span className="filter-tag">
              Customer: {filters.customer_name}
              <button onClick={() => handleFilterChange('customer_name', '')}>×</button>
            </span>
          )}

          {filters.product_line && (
            <span className="filter-tag">
              Product Line: {filters.product_line}
              <button onClick={() => handleFilterChange('product_line', '')}>×</button>
            </span>
          )}
          {filters.customer_pn && (
            <span className="filter-tag">
              Customer PN: {filters.customer_pn}
              <button onClick={() => handleFilterChange('customer_pn', '')}>×</button>
            </span>
          )}
          {(filters.annual_volume_min || filters.annual_volume_max) && (
            <span className="filter-tag">
              Volume: {filters.annual_volume_min || '0'} - {filters.annual_volume_max || '∞'}
              <button onClick={() => {
                handleFilterChange('annual_volume_min', '');
                handleFilterChange('annual_volume_max', '');
              }}>×</button>
            </span>
          )}
          {(filters.target_price_min || filters.target_price_max) && (
            <span className="filter-tag">
              Price: €{filters.target_price_min || '0'} - €{filters.target_price_max || '∞'}
              <button onClick={() => {
                handleFilterChange('target_price_min', '');
                handleFilterChange('target_price_max', '');
              }}>×</button>
            </span>
          )}
          {Object.values(filters).every(val => val === '') && searchTerm === '' && (
            <span className="no-filters">No active filters</span>
          )}
          {searchTerm && (
            <span className="filter-tag">
              Search: "{searchTerm}"
              <button onClick={() => setSearchTerm('')}>×</button>
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="results-count">
            Showing {filteredRfqs.length} of {rfqs.length} RFQs
          </div>
        </div>
        
        <table className="rfq-table">
          <thead>
            <tr>
              <th>RFQ ID</th>
              <th>Customer</th>
              <th>Product Line</th>
              <th>Customer PN</th>
              <th>Annual Volume</th>
              <th>Target Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRfqs.map((rfq) => (
              <tr key={rfq.rfq_id} className="table-row">
                <td className="rfq-id">{rfq.rfq_id}</td>
                <td className="customer-cell">
                  <div className="customer-info">
                    <div className="customer-name">{rfq.customer_name}</div>
                    <div className="customer-email">{rfq.contact_email}</div>
                  </div>
                </td>
                <td>{rfq.product_line}</td>
                <td className="customer-pn">{rfq.customer_pn}</td>
                <td className="volume-cell">
                  {rfq.annual_volume.toLocaleString()}
                </td>
                <td className="price-cell">
                  €{rfq.target_price_eur?.toLocaleString()}
                </td>
                <td>
                  <span className={getStatusBadge(rfq.status)}>
                    {rfq.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetails(rfq)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredRfqs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No RFQs Found</h3>
            <p>No RFQs match your current search and filter criteria.</p>
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {selectedRfq && (
        <RFQModal
          rfq={selectedRfq}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RFQTable;
