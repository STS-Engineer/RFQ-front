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
    to_total_min: '',
    to_total_max: '',
    requester: '',
    delivery_zone: '',
    application: '',
  });

  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRM' | 'DECLINE'>('PENDING');
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  useEffect(() => {
    fetchGroupedRFQs();
  }, []);

  // Reset to page 1 when filters or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, activeTab]);

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

  const handleRowClick = (rfq: RFQ) => {
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
      to_total_min: '',
      to_total_max: '',
      requester: '',
      delivery_zone: '',
      application: ''
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
      const matchesSearch =
        searchTerm === '' ||
        rfq.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.customer_pn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.product_line?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.rfq_id.toString().includes(searchTerm) ||
        rfq.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRfqId = filters.rfq_id === '' || rfq.rfq_id.toString().includes(filters.rfq_id);
      const matchesCustomerName =
        filters.customer_name === '' || rfq.customer_name.toLowerCase().includes(filters.customer_name.toLowerCase());
      const matchesProductLine =
        filters.product_line === '' || rfq.product_line.toLowerCase().includes(filters.product_line.toLowerCase());
      const matchesCustomerPn =
        filters.customer_pn === '' || rfq.customer_pn.toLowerCase().includes(filters.customer_pn.toLowerCase());
      const matchesRequester =
        filters.requester === '' || rfq.created_by_email?.toLowerCase().includes(filters.requester.toLowerCase());

      const matchesAnnualVolumeMin =
        filters.annual_volume_min === '' || rfq.annual_volume >= parseInt(filters.annual_volume_min || '0');
      const matchesAnnualVolumeMax =
        filters.annual_volume_max === '' || rfq.annual_volume <= parseInt(filters.annual_volume_max || '999999999');
      const matchesTargetPriceMin =
        filters.target_price_min === '' ||
        (rfq.target_price_eur && rfq.target_price_eur >= parseInt(filters.target_price_min || '0'));
      const matchesTargetPriceMax =
        filters.target_price_max === '' ||
        (rfq.target_price_eur && rfq.target_price_eur <= parseInt(filters.target_price_max || '999999999'));
      const matchesDeliveryzone =
        filters.requester === '' || rfq.delivery_zone?.toLowerCase().includes(filters.delivery_zone.toLowerCase());

      const matchesApllication =
        filters.application === '' || rfq.application.toLowerCase().includes(filters.application.toLowerCase());
      return (
        matchesSearch &&
        matchesRfqId &&
        matchesCustomerName &&
        matchesProductLine &&
        matchesCustomerPn &&
        matchesAnnualVolumeMin &&
        matchesAnnualVolumeMax &&
        matchesTargetPriceMin &&
        matchesTargetPriceMax &&
        matchesRequester &&
        matchesDeliveryzone &&
        matchesApllication
      );
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


  // Pagination calculations
  const filteredRfqs = filterRfqs(groupedRfqs[activeTab]);
  const totalPages = Math.ceil(filteredRfqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRfqs = filteredRfqs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPaginationRange = () => {
    const range = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) range.push(i);
        range.push('ellipsis');
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1);
        range.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
        range.push('ellipsis');
        range.push(totalPages);
      }
    }

    return range;
  };
  return (
    <div className="rfq-container">
      <div className="rfq-header">
        <h1>RFQ Management</h1>
      </div>

      {/* Tabs */}
      <div className="rfq-tabs">
        {(['PENDING', 'DECLINE', 'CONFIRM'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({groupedRfqs[tab].length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="filters-header">
          <h3>Filter RFQs</h3>
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
        <div className="filters-grid">
          {/* RFQ ID */}
          <div className="filter-group">
            <label>RFQ ID</label>
            <input
              type="text"
              value={filters.rfq_id}
              onChange={e => handleFilterChange('rfq_id', e.target.value)}
              placeholder="Enter RFQ"
              className="filter-input"
            />
          </div>

          {/* Customer Name */}
          <div className="filter-group">
            <label>Customer</label>
            <input
              type="text"
              value={filters.customer_name}
              onChange={e => handleFilterChange('customer_name', e.target.value)}
              placeholder="Enter customer name"
              className="filter-input"
            />
          </div>
          {/* Marker*/}
          <div className="filter-group">
            <label>Market</label>
            <input
              type="text"
              value={filters.delivery_zone}
              onChange={e => handleFilterChange('delivery_zone', e.target.value)}
              placeholder="Enter Delivery Zone"
              className="filter-input"
            />
          </div>

          {/* Requester */}
          <div className="filter-group">
            <label>Requester</label>
            <input
              type="text"
              value={filters.requester}
              onChange={e => handleFilterChange('requester', e.target.value)}
              placeholder="Enter requester email"
              className="filter-input"
            />
          </div>

          {/* Product Line */}
          <div className="filter-group">
            <label>Product Line</label>
            <select
              value={filters.product_line}
              onChange={e => handleFilterChange('product_line', e.target.value)}
              className="filter-select"
            >
              <option value="">All Product Lines</option>
              {getUniqueProductLines().map(line => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>

          {/* Customer PN */}
          <div className="filter-group">
            <label>Customer PN</label>
            <input
              type="text"
              value={filters.customer_pn}
              onChange={e => handleFilterChange('customer_pn', e.target.value)}
              placeholder="Enter Customer PN"
              className="filter-input"
            />
          </div>

          {/* Application */}
          <div className="filter-group">
            <label>Application</label>
            <input
              type="text"
              value={filters.application}
              onChange={e => handleFilterChange('application', e.target.value)}
              placeholder="Enter Application"
              className="filter-input"
            />
          </div>

          {/* Annual Volume */}
          <div className="filter-group">
            <label>Annual Volume</label>
            <div className="range-inputs">
              <input
                type="number"
                value={filters.annual_volume_min}
                onChange={e => handleFilterChange('annual_volume_min', e.target.value)}
                placeholder="Min"
                className="filter-input"
              />
              <span>to</span>
              <input
                type="number"
                value={filters.annual_volume_max}
                onChange={e => handleFilterChange('annual_volume_max', e.target.value)}
                placeholder="Max"
                className="filter-input"
              />
            </div>
          </div>

          {/* Target Price */}
          <div className="filter-group">
            <label>Target Price (€)</label>
            <div className="range-inputs">
              <input
                type="number"
                value={filters.target_price_min}
                onChange={e => handleFilterChange('target_price_min', e.target.value)}
                placeholder="Min"
                className="filter-input"
              />
              <span>to</span>
              <input
                type="number"
                value={filters.target_price_max}
                onChange={e => handleFilterChange('target_price_max', e.target.value)}
                placeholder="Max"
                className="filter-input"
              />
            </div>
          </div>

          {/* TO Total */}
          <div className="filter-group">
            <label>TO Total (k€)</label>
            <div className="range-inputs">
              <input
                type="number"
                value={filters.to_total_min}
                onChange={e => handleFilterChange('to_total_min', e.target.value)}
                placeholder="Min"
                className="filter-input"
              />
              <span>to</span>
              <input
                type="number"
                value={filters.to_total_max}
                onChange={e => handleFilterChange('to_total_max', e.target.value)}
                placeholder="Max"
                className="filter-input"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Table */}
      <div className="table-container no-horizontal-scroll">
        {/* Pagination Controls */}
        {filteredRfqs.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <div className="results-count">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRfqs.length)} of {filteredRfqs.length} RFQs
              </div>

              <div className="items-per-page">
                <label>Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>

              <div className="pagination-buttons">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  First
                </button>

                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>

                <div className="page-numbers">
                  {getPaginationRange().map((page, idx) => (
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="ellipsis">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page as number)}
                        className={`page-number ${currentPage === page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>

                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Last
                </button>
              </div>

              <div className="jump-to-page">
                <label>Go to page:</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (!isNaN(page)) goToPage(page);
                  }}
                  className="page-input"
                />
              </div>
            </div>
          </div>
        )}

        <table className="rfq-table">
          <thead>
            <tr>
              <th>RFQ ID</th>
              <th>Requester</th>
              <th>Customer</th>
              <th>Product Line</th>
              <th>Customer PN</th>
              <th>Application</th>
              <th>Annual Volume</th>
              <th>Target Price (€)</th>
              <th>TO Total (k€)</th>
              <th>Market</th>
              <th>Status</th>

              {/* 🔥 Always show this column when on the CONFIRM tab */}
              {/* 🔥 ALWAYS render an empty th when NOT CONFIRM */}
              {activeTab === 'CONFIRM' ? (
                <th>Project Status</th>
              ) : (
                <th style={{ width: "0px", padding: 0, border: "none" }}></th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedRfqs.length > 0 ? (
              paginatedRfqs.map(rfq => (
                <tr
                  key={rfq.rfq_id}
                  onClick={() => handleRowClick(rfq)}
                  className={`clickable-row ${selectedRfq?.rfq_id === rfq.rfq_id ? 'selected-row' : ''}`}
                >
                  <td>{rfq.rfq_id}</td>
                  <td>
                    {rfq.created_by_email
                      ? (() => {
                        const name = rfq.created_by_email.split('@')[0].replace(/\./g, ' ');
                        return name.charAt(0).toUpperCase() + name.slice(1);
                      })()
                      : '-'}
                  </td>

                  <td>
                    <div className="customer-info">
                      <div>{rfq.customer_name}</div>
                      <div className="customer-email">{rfq.contact_email || '-'}</div>
                    </div>
                  </td>

                  <td>{rfq.product_line}</td>
                  <td>{rfq.customer_pn}</td>
                  <td>{rfq.application}</td>
                  <td>{rfq.annual_volume?.toLocaleString()}</td>
                  <td>{rfq.target_price_eur ? rfq.target_price_eur.toLocaleString() : '-'}€</td>
                  <td>{rfq.to_total}</td>
                  <td>{rfq.delivery_zone}</td>

                  <td>
                    <span className={getStatusBadge(rfq.status)}>{rfq.status}</span>
                  </td>

                  {/* 🔥 Show IN COSTING only for Confirm tab */}
                  {/* Project Status column */}
                  {activeTab === "CONFIRM" ? (
                    <td>
                      <span className="status-badge costing">IN COSTING</span>
                    </td>
                  ) : (
                    <td style={{ width: "0px", padding: 0, border: "none" }}></td>
                  )}
                </tr>
              ))
            ) : (
              // 🔥 Fix: correct colSpan so the header aligns properly
              <tr>
                <td
                  colSpan={activeTab === "CONFIRM" ? 12 : 11}
                  className="no-data"
                >
                  No RFQs Found
                </td>
              </tr>
            )}
          </tbody>
        </table>


        {filterRfqs(groupedRfqs[activeTab]).length === 0 && (
          <div className="empty-state">
            <h3>No RFQs Found</h3>
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {selectedRfq && (
        <RFQModal rfq={selectedRfq} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default RFQTable;
