// components/RFQModal.tsx
import React from 'react';
import { RFQ } from '../types/rfq';
import './RFQModal.css';

// Import export libraries
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import logo from "../assets/logo-avocarbon-1-removebg-preview.png"; 

interface RFQModalProps {
  rfq: RFQ;
  isOpen: boolean;
  onClose: () => void;
}

const RFQModal: React.FC<RFQModalProps> = ({ rfq, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Export to PDF function
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('rfq-modal-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`RFQ_${rfq.rfq_id}_${rfq.customer_name}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      const excelData = [
        ['RFQ DETAILS REPORT', ''],
        ['Generated on', new Date().toLocaleString()],
        ['', ''],
        ['BASIC INFORMATION', ''],
        ['RFQ ID', rfq.rfq_id],
        ['Customer Name', rfq.customer_name],
        ['Application', rfq.application],
        ['Product Line', rfq.product_line],
        ['Customer PN', rfq.customer_pn],
        ['Revision Level', rfq.revision_level],
        ['Status', rfq.status],
        ['', ''],
        ['CONTACT INFORMATION', ''],
        ['Contact Role', rfq.contact_role],
        ['Email', rfq.contact_email],
        ['Phone', rfq.contact_phone],
        ['', ''],
        ['BUSINESS DETAILS', ''],
        ['Annual Volume', rfq.annual_volume],
        ['Target Price (EUR)', `€${rfq.target_price_eur?.toLocaleString()}`],
        ['Development Costs', `€${rfq.development_costs?.toLocaleString()}`],
        ['Payment Terms', rfq.payment_terms],
        ['Delivery Conditions', rfq.delivery_conditions],
        ['Business Trigger', rfq.business_trigger],
        ['', ''],
        ['TIMELINE INFORMATION', ''],
        ['RFQ Reception Date', new Date(rfq.rfq_reception_date).toLocaleDateString()],
        ['Quotation Expected Date', new Date(rfq.quotation_expected_date).toLocaleDateString()],
        ['SOP Year', rfq.sop_year],
        ['RFQ Created At', new Date(rfq.rfq_created_at).toLocaleDateString()],
        ['', ''],
        ['TECHNICAL DETAILS', ''],
        ['Manufacturing Location', rfq.manufacturing_location],
        ['Design Responsibility', rfq.design_responsibility],
        ['Validation Responsibility', rfq.validation_responsibility],
        ['Design Ownership', rfq.design_ownership],
        ['Technical Capacity', rfq.technical_capacity],
        ['Scope Alignment', rfq.scope_alignment],
        ['Overall Feasibility', rfq.overall_feasibility],
        ['', ''],
        ['RISK & DECISION', ''],
        ['Risks', rfq.risks || 'N/A'],
        ['Decision', rfq.decision || 'N/A'],
        ['Entry Barriers', rfq.entry_barriers || 'N/A'],
        ['Customer Status', rfq.customer_status || 'N/A'],
        ['', ''],
        ['NOTES & COMMENTS', ''],
        ['Product Feasibility Note', rfq.product_feasibility_note || 'N/A'],
        ['Strategic Note', rfq.strategic_note || 'N/A'],
        ['Validator Comments', rfq.validator_comments || 'N/A'],
        ['Final Recommendation', rfq.final_recommendation || 'N/A']
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 30 },
        { wch: 50 }
      ];
      ws['!cols'] = colWidths;

      // Style headers
      for (let i = 0; i < excelData.length; i++) {
        if (excelData[i][0] && (excelData[i][0].includes('REPORT') || 
            excelData[i][0].includes('INFORMATION') || 
            excelData[i][0].includes('DETAILS') || 
            excelData[i][0].includes('NOTES'))) {
          if (!ws[`A${i + 1}`]) ws[`A${i + 1}`] = {};
          if (!ws[`B${i + 1}`]) ws[`B${i + 1}`] = {};
          
          ws[`A${i + 1}`].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "E8F4FF" } }
          };
          ws[`B${i + 1}`].s = {
            font: { bold: true, sz: 12 },
            fill: { fgColor: { rgb: "E8F4FF" } }
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'RFQ Details');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(data, `RFQ_${rfq.rfq_id}_${rfq.customer_name}_Details.xlsx`);

    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': '#ffb300',
      'approved': '#4caf50',
      'rejected': '#f44336',
      'in_review': '#2196f3',
      'completed': '#9c27b0',
      'continu': '#2196f3'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-left">
            <div >
              <img 
                src={logo}  
                alt="AvoCarbon Logo" 
                className="logo-img"
              />
           
            </div>
            <div className="modal-title">
              <h2>RFQ Details - #{rfq.rfq_id}</h2>
          
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" id="rfq-modal-content">
          <div className="details-grid">
            {/* Customer Information */}
            <div className="detail-section">
              <h3 className="section-title">Customer Information</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Customer Name</label>
                  <span>{rfq.customer_name}</span>
                </div>
                <div className="detail-item">
                  <label>Application</label>
                  <span>{rfq.application}</span>
                </div>
                <div className="detail-item">
                  <label>Product Line</label>
                  <span>{rfq.product_line}</span>
                </div>
                <div className="detail-item">
                  <label>Customer Part Number</label>
                  <span className="customer-pn">{rfq.customer_pn}</span>
                </div>
                <div className="detail-item">
                  <label>Revision Level</label>
                  <span>{rfq.revision_level}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="detail-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Contact Role</label>
                  <span>{rfq.contact_role}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span className="email">{rfq.contact_email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{rfq.contact_phone}</span>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="detail-section">
              <h3 className="section-title">Business Details</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Annual Volume</label>
                  <span>{rfq.annual_volume?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Target Price</label>
                  <span className="price">€{rfq.target_price_eur?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Development Costs</label>
                  <span>€{rfq.development_costs?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Terms</label>
                  <span>{rfq.payment_terms}</span>
                </div>
                <div className="detail-item">
                  <label>Delivery Conditions</label>
                  <span>{rfq.delivery_conditions}</span>
                </div>
                <div className="detail-item">
                  <label>Business Trigger</label>
                  <span>{rfq.business_trigger}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="detail-section">
              <h3 className="section-title">Timeline</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>RFQ Reception</label>
                  <span>{formatDate(rfq.rfq_reception_date)}</span>
                </div>
                <div className="detail-item">
                  <label>Quotation Expected</label>
                  <span>{formatDate(rfq.quotation_expected_date)}</span>
                </div>
                <div className="detail-item">
                  <label>SOP Year</label>
                  <span>{rfq.sop_year}</span>
                </div>
                <div className="detail-item">
                  <label>RFQ Created</label>
                  <span>{formatDate(rfq.rfq_created_at)}</span>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="detail-section">
              <h3 className="section-title">Technical Details</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Manufacturing Location</label>
                  <span>{rfq.manufacturing_location}</span>
                </div>
                <div className="detail-item">
                  <label>Design Responsibility</label>
                  <span>{rfq.design_responsibility}</span>
                </div>
                <div className="detail-item">
                  <label>Validation Responsibility</label>
                  <span>{rfq.validation_responsibility}</span>
                </div>
                <div className="detail-item">
                  <label>Design Ownership</label>
                  <span>{rfq.design_ownership}</span>
                </div>
                <div className="detail-item">
                  <label>Technical Capacity</label>
                  <span>{rfq.technical_capacity}</span>
                </div>
                <div className="detail-item">
                  <label>Scope Alignment</label>
                  <span>{rfq.scope_alignment}</span>
                </div>
                <div className="detail-item">
                  <label>Overall Feasibility</label>
                  <span>{rfq.overall_feasibility}</span>
                </div>
              </div>
            </div>

            {/* Risk & Decision */}
            <div className="detail-section">
              <h3 className="section-title">Risk & Decision</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Risks</label>
                  <span>{rfq.risks || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Decision</label>
                  <span>{rfq.decision || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Entry Barriers</label>
                  <span>{rfq.entry_barriers || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Customer Status</label>
                  <span>{rfq.customer_status || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <div className="footer-export-buttons">
            <button className="btn-export pdf-export" onClick={exportToPDF}>
              <span className="export-icon">📄</span>
              Download PDF
            </button>
            <button className="btn-export excel-export" onClick={exportToExcel}>
              <span className="export-icon">📊</span>
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQModal;