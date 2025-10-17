// components/RFQModal.tsx
import React, { useEffect } from 'react';
import { RFQ } from '../types/rfq';
import './RFQModal.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserCheck, UserPlus } from 'lucide-react';
import logo from '../assets/logo-avocarbon-1-removebg-preview.png';

interface RFQModalProps {
  rfq: RFQ;
  isOpen: boolean;
  onClose: () => void;
}

const RFQModal: React.FC<RFQModalProps> = ({ rfq, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      console.log('RFQ data in modal:', rfq);
      console.log('RFQ status:', rfq.status);
      console.log('RFQ technical_capacity type:', typeof rfq.technical_capacity, 'value:', rfq.technical_capacity);
      console.log('RFQ scope_alignment type:', typeof rfq.scope_alignment, 'value:', rfq.scope_alignment);
    }
  }, [isOpen, rfq]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const exportToPDF = async () => {
    try {
      const element = document.getElementById('rfq-modal-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
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
        ['Target Price (EUR)', `€${rfq.target_price_eur || 0}`],
        ['Development Costs', rfq.development_costs || 'N/A'], // Treat as string
        ['Payment Terms', rfq.payment_terms],
        ['Delivery Conditions', rfq.delivery_conditions],
        ['Business Trigger', rfq.business_trigger],
        ['', ''],
        ['TIMELINE INFORMATION', ''],
        ['RFQ Reception Date', rfq.rfq_reception_date],
        ['Quotation Expected Date', rfq.quotation_expected_date],
        ['SOP Year', rfq.sop_year],
        ['RFQ Created At', rfq.rfq_created_at],
        ['', ''],
        ['TECHNICAL DETAILS', ''],
        ['Manufacturing Location', rfq.manufacturing_location],
        ['Design Responsibility', rfq.design_responsibility],
        ['Validation Responsibility', rfq.validation_responsibility],
        ['Design Ownership', rfq.design_ownership],
        ['Technical Capacity', formatBoolean(rfq.technical_capacity)],
        ['Scope Alignment', formatBoolean(rfq.scope_alignment)],
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
        ['Final Recommendation', rfq.final_recommendation || 'N/A'],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'RFQ Details');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(data, `RFQ_${rfq.rfq_id}_${rfq.customer_name}_Details.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel file. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'N/A'
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatBoolean = (value: boolean | string | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      return lowerValue === 'true' || lowerValue === 'yes' ? 'Yes' : lowerValue === 'false' || lowerValue === 'no' ? 'No' : value;
    }
    return 'N/A';
  };

  const getSafeValue = (value: any, defaultValue: string = 'N/A') => {
    return value !== null && value !== undefined && value !== '' ? value : defaultValue;
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-header-left">
            <img src={logo} alt="AvoCarbon Logo" className="logo-img" />
            <div className="modal-title">
              <h2>RFQ Details - #{rfq.rfq_id}</h2>
              <span className={`status-badge status-${rfq.status?.toLowerCase()}`}>
                {rfq.status}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" id="rfq-modal-content">
          <div className="details-grid">
            {/* Participants */}
            <div className="detail-section">
              <h3 className="section-title">Participants</h3>
              <div className="section-content participants-section">
                <div className="participant-card">
                  <UserPlus className="participant-icon requester-icon" size={24} />
                  <div className="participant-info">
                    <label>Requester</label>
                    <span>{getSafeValue(rfq.created_by_email)}</span>
                  </div>
                </div>
                <div className="participant-card">
                  <UserCheck className="participant-icon validator-icon" size={24} />
                  <div className="participant-info">
                    <label>Validator</label>
                    <span>{getSafeValue(rfq.validated_by_email)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="detail-section">
              <h3 className="section-title">Customer Information</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Customer Name</label>
                  <span>{getSafeValue(rfq.customer_name)}</span>
                </div>
                <div className="detail-item">
                  <label>Application</label>
                  <span>{getSafeValue(rfq.application)}</span>
                </div>
                <div className="detail-item">
                  <label>Product Line</label>
                  <span>{getSafeValue(rfq.product_line)}</span>
                </div>
                <div className="detail-item">
                  <label>Customer PN</label>
                  <span>{getSafeValue(rfq.customer_pn)}</span>
                </div>
                <div className="detail-item">
                  <label>Revision Level</label>
                  <span>{getSafeValue(rfq.revision_level)}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="detail-section">
              <h3 className="section-title">Contact Information</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Contact Role</label>
                  <span>{getSafeValue(rfq.contact_role)}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{getSafeValue(rfq.contact_email)}</span>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <span>{getSafeValue(rfq.contact_phone)}</span>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="detail-section">
              <h3 className="section-title">Business Details</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Annual Volume</label>
                  <span>{(rfq.annual_volume || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Target Price</label>
                  <span>€{(rfq.target_price_eur || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Development Costs</label>
                  <span>{getSafeValue(rfq.development_costs)}</span>
                </div>
                <div className="detail-item">
                  <label>Payment Terms</label>
                  <span>{getSafeValue(rfq.payment_terms)}</span>
                </div>
                <div className="detail-item">
                  <label>Delivery Conditions</label>
                  <span>{getSafeValue(rfq.delivery_conditions)}</span>
                </div>
                <div className="detail-item">
                  <label>Business Trigger</label>
                  <span>{getSafeValue(rfq.business_trigger)}</span>
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
                  <span>{getSafeValue(rfq.sop_year)}</span>
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
                  <span>{getSafeValue(rfq.manufacturing_location)}</span>
                </div>
                <div className="detail-item">
                  <label>Design Responsibility</label>
                  <span>{getSafeValue(rfq.design_responsibility)}</span>
                </div>
                <div className="detail-item">
                  <label>Validation Responsibility</label>
                  <span>{getSafeValue(rfq.validation_responsibility)}</span>
                </div>
                <div className="detail-item">
                  <label>Design Ownership</label>
                  <span>{getSafeValue(rfq.design_ownership)}</span>
                </div>
                <div className="detail-item">
                  <label>Technical Capacity</label>
                  <span>{formatBoolean(rfq.technical_capacity)}</span>
                </div>
                <div className="detail-item">
                  <label>Scope Alignment</label>
                  <span>{formatBoolean(rfq.scope_alignment)}</span>
                </div>
                <div className="detail-item">
                  <label>Overall Feasibility</label>
                  <span>{getSafeValue(rfq.overall_feasibility)}</span>
                </div>
              </div>
            </div>

            {/* Risk & Decision */}
            <div className="detail-section">
              <h3 className="section-title">Risk & Decision</h3>
              <div className="section-content">
                <div className="detail-item">
                  <label>Risks</label>
                  <span>{getSafeValue(rfq.risks)}</span>
                </div>
                <div className="detail-item">
                  <label>Decision</label>
                  <span>{getSafeValue(rfq.decision)}</span>
                </div>
                <div className="detail-item">
                  <label>Entry Barriers</label>
                  <span>{getSafeValue(rfq.entry_barriers)}</span>
                </div>
                <div className="detail-item">
                  <label>Customer Status</label>
                  <span>{getSafeValue(rfq.customer_status)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Comments */}
            <div className="detail-section">
              <h3 className="section-title">Notes & Comments</h3>
              <div className="section-content">
                <div className="detail-item full-width">
                  <label>Product Feasibility Note</label>
                  <span>{getSafeValue(rfq.product_feasibility_note)}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Strategic Note</label>
                  <span>{getSafeValue(rfq.strategic_note)}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Validator Comments</label>
                  <span>{getSafeValue(rfq.validator_comments)}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Final Recommendation</label>
                  <span>{getSafeValue(rfq.final_recommendation)}</span>
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
              📄 Download PDF
            </button>
            <button className="btn-export excel-export" onClick={exportToExcel}>
              📊 Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFQModal;
