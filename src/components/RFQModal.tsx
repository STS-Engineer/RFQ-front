import React, { useEffect, useState } from 'react';
import { RFQ } from '../types/rfq';
import './RFQModal.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { UserCheck, UserPlus, Sparkles, Eye } from 'lucide-react';
import logo from '../assets/logo-avocarbon-1-removebg-preview.png';
import CostingDetailsModal from './CostingDetailsModal.tsx'; // Import the costing modal
import { toast } from 'react-toastify'; // Add if not already imported

interface RFQModalProps {
  rfq: RFQ;
  isOpen: boolean;
  onClose: () => void;
}

const RFQModal: React.FC<RFQModalProps> = ({ rfq, isOpen, onClose }) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [costingDetails, setCostingDetails] = useState(null);
  const [loadingCosting, setLoadingCosting] = useState(false);

  useEffect(() => {
    if (isOpen) console.log('RFQ data loaded in modal:', rfq);
  }, [isOpen, rfq]);

  const parseFilePaths = (filePathString: string | string[]): string[] => {
    if (!filePathString) return [];

    // If backend later sends real array
    if (Array.isArray(filePathString)) return filePathString;

    return filePathString
      .replace(/^{|}$/g, '')
      .split(',')
      .map(path => path.trim())
      ?.filter(Boolean);
  };


  const files = parseFilePaths(rfq.rfq_file_path);



  if (!isOpen) return null;

  // ------------------- Helper Functions -------------------
  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime())
      ? 'N/A'
      : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatBoolean = (val: boolean | string | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    const v = String(val).toLowerCase();
    if (v === 'true' || v === 'yes') return 'Yes';
    if (v === 'false' || v === 'no') return 'No';
    return v;
  };

  const openPdfGallery = (files: string[], clickedFile: string) => {
    const onlyPdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    setPdfFiles(onlyPdfs);
    setCurrentPdfIndex(onlyPdfs.indexOf(clickedFile));
    setPdfPreviewUrl(getFileUrl(clickedFile));
  };

  const formatNumber = (val: number | undefined) => (val ? Math.round(val).toLocaleString() : '0');

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;

    // ⚠ Change this to your production backend when deploying
    return `https://rfq-back.azurewebsites.net${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };


  // ------------------- Fetch Costing Details -------------------
  const fetchCostingDetails = async () => {
    if (!rfq?.rfq_id) return;

    setLoadingCosting(true);
    try {
      const response = await fetch(`https://rfq-back.azurewebsites.net/ajouter/costing-details/${rfq.rfq_id}`);
      const result = await response.json();

      if (result.success) {
        setCostingDetails(result.data);
        setCostingModalOpen(true);
      } else {
        toast.error('Failed to fetch costing details: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching costing details:', error);
      toast.error('Error fetching costing details. Please try again.');
    } finally {
      setLoadingCosting(false);
    }
  };

  // ------------------- Overlay Click -------------------
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ------------------- Document Handling -------------------
  const handleDocumentClick = (filePath: string) => {
    if (!filePath) return;

    const allFiles = parseFilePaths(rfq.rfq_file_path);
    const fileUrl = getFileUrl(filePath);
    const ext = fileUrl.split('.').pop()?.toLowerCase();

    if (!ext) {
      toast.error('Unknown file type');
      return;
    }

    // ✅ If NOT PDF → download
    if (ext !== 'pdf') {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileUrl.split('/').pop() || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // ✅ If PDF → open gallery
    const onlyPdfs = allFiles.filter(f =>
      f.toLowerCase().endsWith('.pdf')
    );

    const startIndex = onlyPdfs.findIndex(f => f === filePath);

    setPdfFiles(onlyPdfs);
    setCurrentPdfIndex(startIndex >= 0 ? startIndex : 0);

    setLoading(true);
    setPdfPreviewUrl(null);

    setTimeout(() => {
      setPdfPreviewUrl(getFileUrl(onlyPdfs[startIndex]));
      setIframeKey(prev => prev + 1);
      setZoomLevel(1);
      setLoading(false);
    }, 300);
  };


  const goToNextPdf = () => {
    if (currentPdfIndex >= pdfFiles.length - 1) return;

    const newIndex = currentPdfIndex + 1;
    setLoading(true);

    setTimeout(() => {
      setCurrentPdfIndex(newIndex);
      setPdfPreviewUrl(getFileUrl(pdfFiles[newIndex]));
      setIframeKey(prev => prev + 1);
      setLoading(false);
    }, 300);
  };

  const goToPrevPdf = () => {
    if (currentPdfIndex <= 0) return;

    const newIndex = currentPdfIndex - 1;
    setLoading(true);

    setTimeout(() => {
      setCurrentPdfIndex(newIndex);
      setPdfPreviewUrl(getFileUrl(pdfFiles[newIndex]));
      setIframeKey(prev => prev + 1);
      setLoading(false);
    }, 300);
  };

  // ------------------- Export: PDF -------------------
  const exportToPDF = async () => {
    try {
      const element = document.getElementById('rfq-modal-content');
      if (!element) return;

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = element.scrollWidth + 'px';
      clone.style.height = element.scrollHeight + 'px';
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.background = '#ffffff';
      clone.style.overflow = 'visible';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`RFQ_${rfq.rfq_id}_${rfq.customer_name}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // ------------------- Export: Excel -------------------
  const exportToExcel = () => {
    try {
      const excelData = [
        ['RFQ DETAILS REPORT'],
        ['Generated on', new Date().toLocaleString()],
        [''],
        ['BASIC INFORMATION'],
        ['RFQ ID', rfq.rfq_id],
        ['Customer Name', rfq.customer_name],
        ['Application', rfq.application],
        ['Product Line', rfq.product_line],
        ['Customer PN', rfq.customer_pn],
        ['Revision Level', rfq.revision_level],
        ['Status', rfq.status],
        [''],
        ['CONTACT INFORMATION'],
        ['Contact Role', rfq.contact_role],
        ['Email', rfq.contact_email],
        ['Phone', rfq.contact_phone],
        [''],
        ['BUSINESS DETAILS'],
        ['Annual Volume', rfq.annual_volume],
        ['Target Price (EUR)', rfq.target_price_eur || 0],
        ['TO Total (K€)', rfq.to_total || 0],
        ['Development Costs', rfq.development_costs || 'N/A'],
        ['Payment Terms', rfq.payment_terms],
        ['Delivery Conditions', rfq.delivery_conditions],
        ['Business Trigger', rfq.business_trigger],
        [''],
        ['TIMELINE INFORMATION'],
        ['RFQ Reception Date', rfq.rfq_reception_date],
        ['Quotation Expected Date', rfq.quotation_expected_date],
        ['SOP Year', rfq.sop_year],
        ['RFQ Created At', rfq.rfq_created_at],
        [''],
        ['TECHNICAL DETAILS'],
        ['Manufacturing Location', rfq.manufacturing_location],
        ['Design Responsibility', rfq.design_responsibility],
        ['Validation Responsibility', rfq.validation_responsibility],
        ['Design Ownership', rfq.design_ownership],
        ['Technical Capacity', formatBoolean(rfq.technical_capacity)],
        ['Scope Alignment', formatBoolean(rfq.scope_alignment)],
        ['Overall Feasibility', rfq.overall_feasibility],
        [''],
        ['RISK & DECISION'],
        ['Risks', rfq.risks || 'N/A'],
        ['Decision', rfq.decision || 'N/A'],
        ['Entry Barriers', rfq.entry_barriers || 'N/A'],
        ['Customer Status', rfq.customer_status || 'N/A'],
        [''],
        ['NOTES & COMMENTS'],
        ['Product Feasibility Note', rfq.product_feasibility_note || 'N/A'],
        ['Strategic Note', rfq.strategic_note || 'N/A'],
        ['Validator Comments', rfq.validator_comments || 'N/A'],
        ['Final Recommendation', rfq.final_recommendation || 'N/A'],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'RFQ Details');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `RFQ_${rfq.rfq_id}_${rfq.customer_name}_Details.xlsx`);
    } catch (err) {
      console.error('Error generating Excel:', err);
      toast.error('Failed to generate Excel. Please try again.');
    }
  };

  // ------------------- Open AI Assistant -------------------
  const openAIAssistant = () => {
    window.open(
      'https://chatgpt.com/g/g-68d8e2cc2cc08191bafeefd60b31cc62-rfq-integration',
      '_blank',
      'noopener,noreferrer'
    );
  };


  return (
    <>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-header-left">
              <img src={logo} alt="AvoCarbon Logo" className="logo-img" />
              <div className="modal-title">
                <h2>RFQ Details - #{rfq.rfq_id}</h2>
                <span className={`status-badge status-${rfq.status?.toLowerCase()}`}>{rfq.status}</span>
              </div>
            </div>
            <div className="modal-header-actions">
              <button className="ai-assistant-btn" onClick={openAIAssistant}>
                <Sparkles size={18} /> <span>AI Assistant</span>
              </button>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body" id="rfq-modal-content">
            <div className="details-grid">

              {/* Participants */}
              <div className="detail-section">
                <h3 className="section-title">Participants</h3>
                <div className="section-content participants-section">
                  <div className="participant-card">
                    <UserPlus size={22} className="participant-icon requester-icon" />
                    <div className="participant-info">
                      <label>Requester</label>
                      <span>
                        {rfq.created_by_email
                          ? rfq.created_by_email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                          : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="participant-card">
                    <UserCheck size={22} className="participant-icon validator-icon" />
                    <div className="participant-info">
                      <label>Validator</label>
                      <span>
                        {rfq.validated_by_email
                          ? rfq.validated_by_email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="detail-section">
                <h3 className="section-title">Customer Information</h3>
                <div className="section-content">
                  <div className="detail-item"><label>Customer Name</label><span>{rfq.customer_name}</span></div>
                  <div className="detail-item"><label>Application</label><span>{rfq.application}</span></div>
                  <div className="detail-item"><label>Product Line</label><span>{rfq.product_line}</span></div>
                  <div className="detail-item"><label>Customer PN</label><span>{rfq.customer_pn}</span></div>
                  <div className="detail-item"><label>Revision Level</label><span>{rfq.revision_level}</span></div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="detail-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="section-content">
                  <div className="detail-item"><label>Contact Role</label><span>{rfq.contact_role}</span></div>
                  <div className="detail-item"><label>Email</label><span>{rfq.contact_email}</span></div>
                  <div className="detail-item"><label>Phone</label><span>{rfq.contact_phone}</span></div>
                </div>
              </div>

              {/* Business Details */}
              <div className="detail-section">
                <h3 className="section-title">Business Details</h3>
                <div className="section-content">
                  <div className="detail-item"><label>Annual Volume</label><span>{formatNumber(rfq.annual_volume)}</span></div>
                  <div className="detail-item"><label>Target Price</label><span>{rfq.target_price_eur} €</span></div>
                  <div className="detail-item"><label>TO Total</label><span>{rfq.to_total}</span></div>
                  <div className="detail-item"><label>Development Costs</label><span>{rfq.development_costs}</span></div>
                  <div className="detail-item"><label>Payment Terms</label><span>{rfq.payment_terms}</span></div>
                  <div className="detail-item"><label>Delivery Conditions</label><span>{rfq.delivery_conditions}</span></div>
                  <div className="detail-item"><label>Business Trigger</label><span>{rfq.business_trigger}</span></div>
                </div>
              </div>

              {/* Timeline */}
              <div className="detail-section">
                <h3 className="section-title">Timeline</h3>
                <div className="section-content">
                  <div className="detail-item"><label>RFQ Reception</label><span>{formatDate(rfq.rfq_reception_date)}</span></div>
                  <div className="detail-item"><label>Quotation Expected</label><span>{formatDate(rfq.quotation_expected_date)}</span></div>
                  <div className="detail-item"><label>SOP Year</label><span>{rfq.sop_year}</span></div>
                  <div className="detail-item"><label>RFQ Created</label><span>{formatDate(rfq.rfq_created_at)}</span></div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="detail-section">
                <h3 className="section-title">Technical Details</h3>
                <div className="section-content">
                  <div className="detail-item"><label>Manufacturing Location</label><span>{rfq.manufacturing_location}</span></div>
                  <div className="detail-item"><label>Design Responsibility</label><span>{rfq.design_responsibility}</span></div>
                  <div className="detail-item"><label>Validation Responsibility</label><span>{rfq.validation_responsibility}</span></div>
                  <div className="detail-item"><label>Design Ownership</label><span>{rfq.design_ownership}</span></div>
                  <div className="detail-item"><label>Technical Capacity</label><span>{formatBoolean(rfq.technical_capacity)}</span></div>
                  <div className="detail-item"><label>Scope Alignment</label><span>{formatBoolean(rfq.scope_alignment)}</span></div>
                  <div className="detail-item"><label>Overall Feasibility</label><span>{rfq.overall_feasibility}</span></div>
                </div>
              </div>

              {/* Risk & Decision */}
              <div className="detail-section">
                <h3 className="section-title">Risk & Decision</h3>
                <div className="section-content">
                  <div className="detail-item"><label>Risks</label><span>{rfq.risks}</span></div>
                  <div className="detail-item"><label>Decision</label><span>{rfq.decision}</span></div>
                  <div className="detail-item"><label>Entry Barriers</label><span>{rfq.entry_barriers}</span></div>
                  <div className="detail-item"><label>Customer Status</label><span>{rfq.customer_status}</span></div>
                </div>
              </div>

              {/* Notes & Comments */}
              <div className="detail-section">
                <h3 className="section-title">Notes & Comments</h3>
                <div className="section-content">
                  <div className="detail-item full-width"><label>Product Feasibility Note</label><span>{rfq.product_feasibility_note}</span></div>
                  <div className="detail-item full-width"><label>Strategic Note</label><span>{rfq.strategic_note}</span></div>
                  <div className="detail-item full-width"><label>Validator Comment</label><span>{rfq.validator_comments}</span></div>
                  <div className="detail-item full-width"><label>Requester Comment</label><span>{rfq.requester_comment}</span></div>
                  <div className="detail-item full-width"><label>Final Recommendation</label><span>{rfq.final_recommendation}</span></div>
                </div>
              </div>

              {/* Documents */}
              {/* Documents */}
              <div className="detail-section">
                <h3 className="section-title">Documents</h3>
                <div className="section-content">
                  {files.length > 0 ? (
                    <div className="detail-item full-width">
                      <label>RFQ Files</label>

                      {files.map((file, index) => {
                        const fileName = file.split('/').pop();

                        return (
                          <button
                            key={index}
                            className="document-btn"
                            onClick={() => handleDocumentClick(file)}
                          >
                            📄 {fileName}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span>No document available</span>
                  )}
                </div>

                {/* PDF Preview Modal */}
                {pdfPreviewUrl && (
                  <div
                    className="pdf-modal-overlay"
                    onClick={() => setPdfPreviewUrl(null)}
                  >
                    <div
                      className="pdf-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="pdf-modal-header">
                        <h4>
                          📑 {pdfFiles[currentPdfIndex]?.split('/').pop()}
                        </h4>

                        <div className="pdf-controls">
                          <button
                            disabled={currentPdfIndex === 0}
                            onClick={goToPrevPdf}
                          >
                            ⬅
                          </button>

                          <button
                            disabled={currentPdfIndex === pdfFiles.length - 1}
                            onClick={goToNextPdf}
                          >
                            ➡
                          </button>

                          <button onClick={() => setZoomLevel(z => Math.min(z + 0.2, 2))}>
                            ➕
                          </button>

                          <button onClick={() => setZoomLevel(z => Math.max(z - 0.2, 0.6))}>
                            ➖
                          </button>

                          <button
                            className="close-btn"
                            onClick={() => setPdfPreviewUrl(null)}
                          >
                            ✖
                          </button>
                        </div>
                      </div>

                      <div className="pdf-viewer">
                        {loading ? (
                          <div className="pdf-spinner">Loading...</div>
                        ) : (
                          <embed
                            key={iframeKey}
                            src={pdfPreviewUrl}
                            type="application/pdf"
                            style={{
                              width: '100%',
                              height: '800px',
                              border: 'none',
                              transform: `scale(${zoomLevel})`,
                              transformOrigin: 'center top',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Costing Section */}
              {rfq.status === 'CONFIRM' && (
                <div className="detail-section">
                  <h3 className="section-title">Costing</h3>
                  <div className="section-content">

                    {/* View Costing Details Button */}
                    <div className="detail-item full-width">
                      <button
                        className="view-costing-btn"
                        onClick={fetchCostingDetails}
                        disabled={loadingCosting}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '15px'
                        }}
                      >
                        <Eye size={18} />
                        {loadingCosting ? 'Loading...' : 'View Costing Details'}
                      </button>
                    </div>



                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Close</button>
            <div className="footer-export-buttons">
              <button className="btn-export pdf-export" onClick={exportToPDF}>📄 Download PDF</button>
              <button className="btn-export excel-export" onClick={exportToExcel}>📊 Download Excel</button>
            </div>
          </div>
        </div>
      </div>

      {/* Costing Details Modal */}
      {costingModalOpen && (
        <CostingDetailsModal
          open={costingModalOpen}
          onClose={() => setCostingModalOpen(false)}
          rfqId={rfq.rfq_id}
          initialData={costingDetails}
        />
      )}
    </>
  );
};

export default RFQModal;
