import React, { useEffect, useState } from 'react';
import { RFQ } from '../types/rfq';
import './RFQModal.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from "axios";
import { UserCheck, UserPlus, Sparkles } from 'lucide-react';
import logo from '../assets/logo-avocarbon-1-removebg-preview.png';

interface RFQModalProps {
  rfq: RFQ;
  isOpen: boolean;
  onClose: () => void;
}

const RFQModal: React.FC<RFQModalProps> = ({ rfq, isOpen, onClose }) => {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [iframeKey, setIframeKey] = useState<number>(0); // ⬅️ new key to force re-render
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [costingFile, setCostingFile] = useState(rfq.costingfile || "");
  
  useEffect(() => {
    if (isOpen) console.log('RFQ data loaded in modal:', rfq);
  }, [isOpen, rfq]);

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

 
  const formatNumber = (val: number | undefined) => (val ? Math.round(val).toLocaleString() : '0');

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `https://rfq-back.azurewebsites.net/${filePath}`;
  };

  // ------------------- Overlay Click -------------------
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };


  // ------------------- Document Handling -------------------
const handleDocumentClick = (filePath: string) => {
  if (!filePath) return;

  const fileUrl = getFileUrl(filePath);
  const ext = fileUrl.split('.').pop()?.toLowerCase();

  if (!ext) return alert('Unknown file type.');

  // 🧹 Clear current preview first to ensure reload
  setPdfPreviewUrl(null);

  setTimeout(() => {
    let previewUrl = '';

    if (ext === 'pdf') {
      previewUrl = fileUrl.includes('githubusercontent')
        ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
        : fileUrl;
    } else if (['xlsx', 'xls', 'docx', 'pptx'].includes(ext)) {
      previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    } else {
      alert(`Unsupported file format: .${ext}`);
      return;
    }

    // ✅ Force re-render and reload of iframe
    setIframeKey((prev) => prev + 1);
    setPdfPreviewUrl(previewUrl);
    setZoomLevel(1);

  }, 200); // Small delay ensures the modal refreshes before reload
};

  // ------------------- Export: PDF -------------------
 const exportToPDF = async () => {
   try {
    const element = document.getElementById('rfq-modal-content');
    if (!element) return;

    // ✅ Clone the content (this ensures scroll-hidden content is captured)
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = element.scrollWidth + 'px';
    clone.style.height = element.scrollHeight + 'px';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '0';
    clone.style.background = '#ffffff';
    clone.style.overflow = 'visible';
    document.body.appendChild(clone);

    // 🖼️ Capture full element
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollY: -window.scrollY, // fix offset issues
    });

    document.body.removeChild(clone); // cleanup

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
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
    alert('Failed to generate PDF. Please try again.');
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
      alert('Failed to generate Excel. Please try again.');
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

  // ------------------- JSX -------------------
  return (
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
        <div className="detail-section">
          <h3 className="section-title">Documents</h3>
        <div className="section-content">
           {rfq.rfq_file_path ? (
        <div className="detail-item full-width">
        <label>RFQ File</label>
        <button
          className="document-btn"
            onClick={() => handleDocumentClick(rfq.rfq_file_path!)}
        >
          📄 {rfq.rfq_file_path.split('/').pop()}
        </button>
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
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-header">
          <h4>📑 {pdfPreviewUrl.split('/').pop()}</h4>
          <div className="pdf-controls">
            <button onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}>
              ➕
            </button>
            <button onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}>
              ➖
            </button>
            <button className="close-btn" onClick={() => setPdfPreviewUrl(null)}>
              ✖
            </button>
          </div>
        </div>
   <div className="pdf-viewer"   
  style={{
    width: "100%",
    height: "100%",
    overflow: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "20px",
    backgroundColor: "#f5f5f5", // Optional: background color
  }}>
  <div style={{
    width: "80%", // 🔥 Control width (80% of container)
    maxWidth: "1030px", // 🔥 Maximum width
    height: "80%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)", // Optional: add shadow
  }}>
    <embed
      key={iframeKey}
      src={`${pdfPreviewUrl}`} // 🔥 Smaller zoom (120% instead of 150%)
      type="application/pdf"
      style={{
        width: '100%',
        height: '800px', // 🔥 Fixed height (adjust as needed)
        border: 'none',
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center top',
      }}
    />
  </div>
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

                  {/* Upload Costing File */}
                  <div className="detail-item full-width">
                    <label>Upload Costing File</label>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.doc,.docx"
                      id={`costingFile-${rfq.rfq_id}`}
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append("file", file);

                        setUploading(true);
                        setUploadMessage("");

                        try {
                          const response = await axios.post(
                            `https://rfq-back.azurewebsites.net/ajouter/rfq/${rfq.rfq_id}/upload`,
                            formData,
                            { headers: { "Content-Type": "multipart/form-data" } }
                          );

                          // ✅ Update state to latest file
                          const newFilePath = response.data.rfq.costingfile || `/uploads/${file.name}`;
                          setCostingFile(newFilePath);

                          // ✅ Reset preview states
                          setPreviewUrl(null);
                          setPreviewType(null);
                          setShowPreview(false);

                          setUploadMessage("✅ Costing file uploaded successfully!");
                          setTimeout(() => {
                            setUploadMessage("");
                          }, 1000)
                          console.log("File uploaded:", response.data);

                        } catch (err: any) {
                          console.error("❌ Error uploading costing file:", err);
                          setUploadMessage("❌ Failed to upload costing file.");
                        } finally {
                          setUploading(false);
                        }
                      }}

                    />

                    {uploading && <p style={{ color: "orange" }}>Uploading...</p>}
                    {uploadMessage && (
                      <p style={{ color: uploadMessage.startsWith("✅") ? "green" : "red" }}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>

                  {/* Display Existing Costing File */}
                  {costingFile && (
                    <div className="detail-item full-width">
                      <label>Current Costing File:</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          className="view-btn"
                          onClick={() => {
                            if (!costingFile) {
                              toast.info("No file to preview");
                              return;
                            }

                            const fileUrl = `http://localhost:4000${costingFile}`;
                            const ext = costingFile.split(".").pop()?.toLowerCase();

                            if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
                              setPreviewType("image");
                            } else if (ext === "pdf") {
                              setPreviewType("pdf");
                            } else if (["xls", "xlsx"].includes(ext)) {
                              // ✅ Open Excel file in a new tab
                              window.open(fileUrl, "_blank");
                              return;
                            } else {
                              toast.info("Preview not supported for this file type.");
                              return;
                            }

                            // ✅ Force refresh preview by clearing and setting URL
                            setPreviewUrl(null);
                            setTimeout(() => {
                              setPreviewUrl(fileUrl);
                              setShowPreview(true);
                            }, 50); // tiny delay ensures React reloads iframe/img
                          }}
                        >
                          👁️ Preview File
                        </button>
                       
                      </div>
                    </div>
                  )}

                  {/* Send Costing File to Requester */}
                  <div className="detail-item full-width">
                    <button
                      className="document-btn"
                      disabled={uploading}
                      onClick={async () => {
                        try {
                          const costingFileInput = document.querySelector<HTMLInputElement>(
                            `#costingFile-${rfq.rfq_id}`
                          );

                          if (!costingFileInput || !costingFileInput.files?.[0]) {
                            toast.warning("Please upload a costing file first!");
                            return;
                          }

                          const file = costingFileInput.files[0];
                          const formData = new FormData();
                          formData.append("file", file);

                          setUploading(true);

                          const response = await axios.post(
                            `https://rfq-back.azurewebsites.net/ajouter/rfq/send-costing-email/${rfq.rfq_id}`,
                            formData,
                            { headers: { "Content-Type": "multipart/form-data" } }
                          );

                          toast.success('Costing file sent to requester successfully!');
                          console.log("Email sent:", response.data);
                        } catch (err: any) {
                          console.error("❌ Error sending costing email:", err);
                          toast.error('Failed to send costing file. Please try again.');
                        } finally {
                          setUploading(false);
                        }
                      }}
                    >
                      {uploading ? (
                        <>
                          <div className="loading-spinner"></div>
                          Sending...
                        </>
                      ) : (
                        '📤 Send Costing to Requester'
                      )}
                    </button>
                  </div>

                  {/* Preview Modal */}
                  {showPreview && previewUrl && (
                    <div className="modal-overlay">
                      <div className="modal-content" style={{ height: "90vh" }}>
                        <button className="close-btn" onClick={() => setShowPreview(false)}>✖</button>

                        {previewType === "image" && (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        )}

                        {previewType === "pdf" && (
                          <iframe
                            key={previewUrl} // force reload if same file
                            src={previewUrl}
                            style={{ width: "100%", height: "100%" }}
                            frameBorder="0"
                          ></iframe>
                        )}
                      </div>
                    </div>
                  )}


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
  );
};

export default RFQModal;
  
