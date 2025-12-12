// src/components/CostingDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, FileText, DollarSign } from 'lucide-react';

interface CostingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  rfqId: string;
  initialData: any;
}

interface BomItem {
  id: number;
  bom_product: string;
  bom_supplier: string;
  bom_qty_per_product: number;
  bom_price_origin: number;
  bom_currency_origin: string;
  bom_landedcost: number;
  sourcing_type: string;
  bom_tooling: number;
  bom_specificcapex: number;
  bom_leadtime_weeks: number;
}

interface RoutingItem {
  id: number;
  router_operation_no: number;
  router_operation_description: string;
  router_machinerate_perhour: number;
  router_setuptime_hours: number;
  router_scraprate: number;
  router_oee: number;
  router_specificcapex: number;
  router_genericcapex: number;
  router_toolingcost_keur: number;
}

interface CostingData {
  costedProduct: any;
  bomParameters: BomItem[];
  routingParameters: RoutingItem[];
  summary: any;
}

const CostingDetailsModal: React.FC<CostingDetailsModalProps> = ({
  open,
  onClose,
  rfqId,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<CostingData>(initialData || {
    costedProduct: null,
    bomParameters: [],
    routingParameters: [],
    summary: {}
  });

  useEffect(() => {
    if (open && initialData) {
      setData(initialData);
    }
  }, [open, initialData]);

  if (!open) return null;

  const formatCurrency = (value: number | undefined | null, currency: string = 'EUR') => {
    if (value == null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number | undefined | null, decimals: number = 2) => {
    if (value == null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const calculateBOMTotals = () => {
    const bom = data.bomParameters || [];
    
    // Calculate total landed cost (sum of all bom_landedcost)
    const totalLandedCost = bom.reduce((sum: number, item: BomItem) => {
      return sum + (Number(item.bom_landedcost) || 0);
    }, 0);
    
    // Calculate total tooling from BOM (sum of all bom_tooling)
    const totalBomTooling = bom.reduce((sum: number, item: BomItem) => {
      return sum + (Number(item.bom_tooling) || 0);
    }, 0);
    
    // Calculate total specific CAPEX from BOM
    const totalBomSpecificCapex = bom.reduce((sum: number, item: BomItem) => {
      return sum + (Number(item.bom_specificcapex) || 0);
    }, 0);
    
    return {
      totalLandedCost,
      totalBomTooling,
      totalBomSpecificCapex,
      externalItems: bom.filter((item: BomItem) => item.sourcing_type === 'Ext').length,
      internalItems: bom.filter((item: BomItem) => item.sourcing_type === 'Int').length
    };
  };

  const calculateRoutingTotals = () => {
    const routing = data.routingParameters || [];
    
    // Calculate total tooling cost from routing (sum of router_toolingcost_keur)
    const totalRoutingTooling = routing.reduce((sum: number, item: RoutingItem) => {
      return sum + (Number(item.router_toolingcost_keur) || 0);
    }, 0);
    
    // Calculate total specific CAPEX from routing
    const totalRoutingSpecificCapex = routing.reduce((sum: number, item: RoutingItem) => {
      return sum + (Number(item.router_specificcapex) || 0);
    }, 0);
    
    // Calculate total generic CAPEX from routing
    const totalRoutingGenericCapex = routing.reduce((sum: number, item: RoutingItem) => {
      return sum + (Number(item.router_genericcapex) || 0);
    }, 0);
    
    // Calculate total setup time
    const totalSetupTime = routing.reduce((sum: number, item: RoutingItem) => {
      return sum + (Number(item.router_setuptime_hours) || 0);
    }, 0);
    
    // Calculate average OEE
    const avgOEE = routing.length > 0 ? 
      routing.reduce((sum: number, item: RoutingItem) => sum + (Number(item.router_oee) || 0), 0) / routing.length : 0;
    
    return {
      totalRoutingTooling,
      totalRoutingSpecificCapex,
      totalRoutingGenericCapex,
      totalSetupTime,
      avgOEE
    };
  };

  const bomTotals = calculateBOMTotals();
  const routingTotals = calculateRoutingTotals();
  


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 0) {
      // BOM Export
      csvContent += "Product,Supplier,Qty per Product,Origin Price,Currency,Landed Cost,Sourcing Type,Tooling Cost\n";
      data.bomParameters.forEach((item: BomItem) => {
        csvContent += `"${item.bom_product || ''}","${item.bom_supplier || ''}",${item.bom_qty_per_product || 0},${item.bom_price_origin || 0},"${item.bom_currency_origin || 'EUR'}",${item.bom_landedcost || 0},"${item.sourcing_type || ''}",${item.bom_tooling || 0}\n`;
      });
    } else {
      // Routing Export
      csvContent += "Operation No,Description,Machine Rate/hr,Setup Time (hrs),Scrap Rate (%),OEE (%),Specific CAPEX,Generic CAPEX,Tooling Cost\n";
      data.routingParameters.forEach((item: RoutingItem) => {
        csvContent += `${item.router_operation_no || 0},"${item.router_operation_description || ''}",${item.router_machinerate_perhour || 0},${item.router_setuptime_hours || 0},${((item.router_scraprate || 0) * 100).toFixed(2)},${((item.router_oee || 0) * 100).toFixed(2)},${item.router_specificcapex || 0},${item.router_genericcapex || 0},${item.router_toolingcost_keur || 0}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `costing_data_${rfqId}_${activeTab === 0 ? 'bom' : 'routing'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" style={{ maxWidth: '1200px', maxHeight: '90vh', width: '95%' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <DollarSign size={24} style={{ color: '#4CAF50' }} />
            <div className="modal-title">
              <h2>Costing Details - RFQ: {rfqId}</h2>
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="close-btn" onClick={onClose} style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            {/* Total BOM Items */}
            <div className="summary-card" style={{
              background: '#e8f5e9',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #c8e6c9'
            }}>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>
                Total BOM Items
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>
                {data.bomParameters?.length || 0}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  background: '#c8e6c9',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {bomTotals.internalItems} Internal
                </span>
                <span style={{
                  fontSize: '11px',
                  background: '#ffecb3',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {bomTotals.externalItems} External
                </span>
              </div>
            </div>

     

            {/* Routing Operations */}
            <div className="summary-card" style={{
              background: '#f3e5f5',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e1bee7'
            }}>
              <div style={{ fontSize: '12px', color: '#7b1fa2', fontWeight: '600' }}>
                Routing Operations
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a148c' }}>
                {data.routingParameters?.length || 0}
              </div>
            </div>

    

          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            <button
              style={{
                padding: '12px 20px',
                background: activeTab === 0 ? '#4CAF50' : 'transparent',
                color: activeTab === 0 ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px'
              }}
              onClick={() => setActiveTab(0)}
            >
              <FileText size={16} style={{ marginRight: '8px' }} />
              BOM Components ({data.bomParameters?.length || 0})
            </button>
            <button
              style={{
                padding: '12px 20px',
                background: activeTab === 1 ? '#2196F3' : 'transparent',
                color: activeTab === 1 ? 'white' : '#333',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => setActiveTab(1)}
            >
              <FileSpreadsheet size={16} style={{ marginRight: '8px' }} />
              Routing Operations ({data.routingParameters?.length || 0})
            </button>
          </div>

          {/* BOM Table */}
          {activeTab === 0 && (
            <div style={{ overflow: 'auto', maxHeight: '400px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead style={{
                  background: '#f5f5f5',
                  position: 'sticky',
                  top: 0
                }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Supplier</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Qty/Product</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Origin Price</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Landed Cost</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Sourcing</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tooling</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bomParameters?.map((item: BomItem, index: number) => (
                    <tr key={item.id || index} style={{
                      borderBottom: '1px solid #eee'
                    }}>
                      <td style={{ padding: '12px' }}>{index + 1}</td>
                      <td style={{ padding: '12px' }}>{item.bom_product || '-'}</td>
                      <td style={{ padding: '12px' }}>{item.bom_supplier || '-'}</td>
                      <td style={{ padding: '12px' }}>{formatNumber(item.bom_qty_per_product, 4)}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(item.bom_price_origin, item.bom_currency_origin)}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(item.bom_landedcost)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: item.sourcing_type === 'Int' ? '#c8e6c9' : '#ffecb3',
                          color: item.sourcing_type === 'Int' ? '#1b5e20' : '#ff8f00'
                        }}>
                          {item.sourcing_type || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(item.bom_tooling)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  {data.bomParameters && data.bomParameters.length > 0 && (
                    <tr style={{
                      background: '#f9f9f9',
                      borderTop: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      <td style={{ padding: '12px' }} colSpan={5}>
                        <strong>TOTAL</strong>
                      </td>
                      <td style={{ padding: '12px', color: '#0d47a1' }}>
                        {formatCurrency(bomTotals.totalLandedCost)}
                      </td>
                      <td style={{ padding: '12px' }}></td>
                      <td style={{ padding: '12px', color: '#e65100' }}>
                        {formatCurrency(bomTotals.totalBomTooling)}
                      </td>
                    </tr>
                  )}
                  {(!data.bomParameters || data.bomParameters.length === 0) && (
                    <tr>
                      <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No BOM data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Routing Table */}
          {activeTab === 1 && (
            <div style={{ overflow: 'auto', maxHeight: '400px' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead style={{
                  background: '#f5f5f5',
                  position: 'sticky',
                  top: 0
                }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Op #</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Machine Rate/hr</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Setup Time</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Scrap Rate</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>OEE</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Spec CAPEX</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tooling Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.routingParameters?.map((item: RoutingItem, index: number) => (
                    <tr key={item.id || index} style={{
                      borderBottom: '1px solid #eee'
                    }}>
                      <td style={{ padding: '12px' }}>{item.router_operation_no}</td>
                      <td style={{ padding: '12px' }}>{item.router_operation_description || '-'}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(item.router_machinerate_perhour)}</td>
                      <td style={{ padding: '12px' }}>
                        {item.router_setuptime_hours ? `${formatNumber(item.router_setuptime_hours, 1)} hrs` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {item.router_scraprate ? `${formatNumber(item.router_scraprate * 100, 1)}%` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {item.router_oee ? `${formatNumber(item.router_oee * 100, 1)}%` : '-'}
                      </td>
                      <td style={{ padding: '12px' }}>{formatCurrency(item.router_specificcapex)}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(item.router_toolingcost_keur)}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  {data.routingParameters && data.routingParameters.length > 0 && (
                    <tr style={{
                      background: '#f9f9f9',
                      borderTop: '2px solid #ddd',
                      fontWeight: 'bold'
                    }}>
                      <td style={{ padding: '12px' }} colSpan={6}>
                        <strong>TOTAL</strong>
                      </td>
                      <td style={{ padding: '12px', color: '#e65100' }}>
                        {formatCurrency(routingTotals.totalRoutingSpecificCapex)}
                      </td>
                      <td style={{ padding: '12px', color: '#e65100' }}>
                        {formatCurrency(routingTotals.totalRoutingTooling)}
                      </td>
                    </tr>
                  )}
                  {(!data.routingParameters || data.routingParameters.length === 0) && (
                    <tr>
                      <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No routing data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{
          padding: '15px 20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-export"
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostingDetailsModal;
