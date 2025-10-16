// types/rfq.ts
export interface Contact {
  contact_id: number;
  contact_role: string;
  contact_email: string;
  contact_phone: string;
  contact_created_at: string;
}

export interface RFQ {
  rfq_id: number;
  customer_name: string;
  application: string;
  product_line: string;
  customer_pn: string;
  revision_level: string;
  delivery_zone: string;
  delivery_plant: string;
  sop_year: number;
  annual_volume: number;
  rfq_reception_date: string;
  quotation_expected_date: string;
  target_price_eur: number;
  delivery_conditions: string;
  payment_terms: string;
  business_trigger: string;
  entry_barriers: string;
  product_feasibility_note: string;
  manufacturing_location: string;
  risks: string;
  decision: string;
  design_responsibility: string;
  validation_responsibility: string;
  design_ownership: string;
  development_costs: number;
  technical_capacity: string;
  scope_alignment: string;
  overall_feasibility: string;
  customer_status: string;
  strategic_note: string;
  final_recommendation: string;
  validator_comments: string;
  status: string;
  rfq_created_at: string;
  contact_id: number;
  contact_role: string;
  contact_email: string;
  contact_phone: string;
  contact_created_at: string;
}