// components/RFQTable.tsx
import React, { useState, useEffect } from 'react';
import { RFQ } from '../types/rfq.ts';
import RFQModal from './RFQModal.tsx';
import './RFQTable.css';

type GroupedRFQs = {
  PENDING: RFQ[];
  CONFIRM: RFQ[];
  DECLINE: RFQ[];
};

const RFQTable: React.FC = () => {
  const [groupedRfqs, setGroupedRfqs] = useState<GroupedRFQs>({
    PENDING: [],
    CONFIRM: [],
    DECLINE: []
  });
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    rfq_id: '',
    customer_name: '',
    product_line: '',
    customer_pn: '',
    annual_volume_min: '',
    annual_volume_max: '',
    target_price_min: '',
    target_price_max: '',
     requester: '' 
  });
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRM' | 'DECLINE'>('PENDING');

  useEffect(() => {
    fetchGroupedRFQs();
  }, []);

  const fetchGroupedRFQs = async () => {
    try {
      const response = await fetch('https://rfq-back.azurewebsites.net/ajouter/rfq');
      const data: GroupedRFQs = await response.json();
      setGroupedRfqs(data);
    } catch (error) {
      console.error('Error fetching grouped RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    setIsModalOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      rfq_id: '',
      customer_name: '',
      product_line: '',
      customer_pn: '',
      annual_volume_min: '',
      annual_volume_max: '',
      target_price_min: '',
      target_price_max: '',
      requester: '' 
    });
    setSearchTerm('');
  };

  const getStatusBadge = (status: string) => {  
    const statusConfig: { [key: string]: string } = {
      PENDING: 'status-badge pending',
      CONFIRM: 'status-badge approved',
      DECLINE: 'status-badge rejected'
    };
    return statusConfig[status] || 'status-badge';
  };

  const filterRfqs = (rfqs: RFQ[]) => {
    return rfqs.filter(rfq => {
      // Global search
      const matchesSearch =
        searchTerm === '' ||
        rfq.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.customer_pn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.product_line?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.rfq_id.toString().includes(searchTerm) ||
        rfq.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Column-specific filters
      const matchesRfqId = filters.rfq_id === '' || rfq.rfq_id.toString().includes(filters.rfq_id);
      const matchesCustomerName = filters.customer_name === '' || rfq.customer_name.toLowerCase().includes(filters.customer_name.toLowerCase());
      const matchesProductLine = filters.product_line === '' || rfq.product_line.toLowerCase().includes(filters.product_line.toLowerCase());
      const matchesCustomerPn = filters.customer_pn === '' || rfq.customer_pn.toLowerCase().includes(filters.customer_pn.toLowerCase());
      const matchesRequester = filters.requester === '' || rfq.created_by_email?.toLowerCase().includes(filters.requester.toLowerCase());
      // Numeric range filters
      const matchesAnnualVolumeMin = filters.annual_volume_min === '' || rfq.annual_volume >= parseInt(filters.annual_volume_min || '0');
      const matchesAnnualVolumeMax = filters.annual_volume_max === '' || rfq.annual_volume <= parseInt(filters.annual_volume_max || '999999999');
      const matchesTargetPriceMin = filters.target_price_min === '' || (rfq.target_price_eur && rfq.target_price_eur >= parseInt(filters.target_price_min || '0'));
      const matchesTargetPriceMax = filters.target_price_max === '' || (rfq.target_price_eur && rfq.target_price_eur <= parseInt(filters.target_price_max || '999999999'));

      return matchesSearch && matchesRfqId && matchesCustomerName && matchesProductLine && matchesCustomerPn &&
             matchesAnnualVolumeMin && matchesAnnualVolumeMax && matchesTargetPriceMin && matchesTargetPriceMax &&  matchesRequester;  ;
    });
  };

  const getUniqueProductLines = () => {
    const allRfqs = [...groupedRfqs.PENDING, ...groupedRfqs.CONFIRM, ...groupedRfqs.DECLINE];
    return Array.from(new Set(allRfqs.map(rfq => rfq.product_line))).filter(Boolean).sort();
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

      {/* Tab Navigation */}
      <div className="rfq-tabs">
        {(['PENDING','DECLINE', 'CONFIRM'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({groupedRfqs[tab].length})
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      <div className="filters-panel">
        <div className="filters-header">
          <h3>Filter RFQs</h3>
          <button className="clear-filters-btn" onClick={clearAllFilters}>Clear All Filters</button>
        </div>
        <div className="filters-grid">

          <div className="filter-group">
            <label>RFQ ID</label>
            <input type="text" value={filters.rfq_id} onChange={(e) => handleFilterChange('rfq_id', e.target.value)} className="filter-input"   placeholder="Enter RFQ" />
          </div>
          <div className="filter-group">
            <label>Customer</label>
            <input type="text" value={filters.customer_name} onChange={(e) => handleFilterChange('customer_name', e.target.value)} className="filter-input"   placeholder="Enter customer name"/>
          </div>
          <div className="filter-group">
           <label>Requester</label>
           <input 
            type="text" 
            value={filters.requester} 
            onChange={(e) => handleFilterChange('requester', e.target.value)} 
            className="filter-input" 
            placeholder="Enter requester email"
             />
            </div>

          <div className="filter-group">
            <label>Product Line</label>
            <select value={filters.product_line} onChange={(e) => handleFilterChange('product_line', e.target.value)} className="filter-select">
              <option value="">All Product Lines</option>
              {getUniqueProductLines().map(line => <option key={line} value={line}>{line}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Customer PN</label>
            <input type="text" value={filters.customer_pn} onChange={(e) => handleFilterChange('customer_pn', e.target.value)} className="filter-input"  placeholder="Enter Customer PN" />
          </div>

          <div className="filter-group volume-filter">
            <label>Annual Volume</label>
            <div className="range-filter-group">
              <input type="number" placeholder="Min" value={filters.annual_volume_min} onChange={(e) => handleFilterChange('annual_volume_min', e.target.value)} className="range-input" min={0} />
              <span className="range-separator">to</span>
              <input type="number" placeholder="Max" value={filters.annual_volume_max} onChange={(e) => handleFilterChange('annual_volume_max', e.target.value)} className="range-input" min={0} />
            </div>
          </div>

          <div className="filter-group price-filter">
            <label>Target Price (€)</label>
            <div className="range-filter-group">
              <input type="number" placeholder="Min" value={filters.target_price_min} onChange={(e) => handleFilterChange('target_price_min', e.target.value)} className="range-input" min={0} step={0.01} />
              <span className="range-separator">to</span>
              <input type="number" placeholder="Max" value={filters.target_price_max} onChange={(e) => handleFilterChange('target_price_max', e.target.value)} className="range-input" min={0} step={0.01} />
            </div>
          </div>
        </div>
      </div>

      {/* Table for Active Tab */}
      <div className="table-container">
        <div className="table-header">
          Showing {filterRfqs(groupedRfqs[activeTab]).length} of {groupedRfqs[activeTab].length} RFQs
        </div>

        <table className="rfq-table">
          <thead>
            <tr>
              <th>RFQ ID</th>
              <th>Requester</th>
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
            {filterRfqs(groupedRfqs[activeTab]).map(rfq => (
              <tr key={rfq.rfq_id}>
                <td>{rfq.rfq_id}</td>
                <td>{rfq.created_by_email || '-'}</td>
                <td>
                  <div className="customer-info">
                    <div>{rfq.customer_name}</div>
                    <div className="customer-email">{rfq.contact_email || '-'}</div>
                  </div>
                </td>
                <td>{rfq.product_line}</td>
           
                <td>{rfq.customer_pn}</td>
                <td>{rfq.annual_volume?.toLocaleString()}</td>
                <td>€{rfq.target_price_eur?.toLocaleString()}</td>
                <td><span className={getStatusBadge(rfq.status)}>{rfq.status}</span></td>
                <td><button className="view-details-btn" onClick={() => handleViewDetails(rfq)}>View Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {filterRfqs(groupedRfqs[activeTab]).length === 0 && (
          <div className="empty-state">
            <h3>No RFQs Found</h3>
            <button className="clear-filters-btn" onClick={clearAllFilters}>Clear All Filters</button>
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
