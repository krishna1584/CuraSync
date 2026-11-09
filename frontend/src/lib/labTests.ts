// Lab tests the hospital offers, shared by patient and staff booking.
export interface LabTest {
  id: string;
  name: string;
  category: string;
  code: string;
  description: string;
  price: number;
  duration: string;
  preparationRequired: boolean;
  fastingRequired: boolean;
  sampleType: string;
}

export const LAB_TESTS: LabTest[] = [
  // Blood Tests
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'Blood Tests', code: 'CBC001', description: 'Comprehensive blood analysis including RBC, WBC, platelets', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '2', name: 'Blood Glucose (Fasting)', category: 'Diabetes Tests', code: 'GLU001', description: 'Measures blood sugar levels after fasting', price: 200, duration: '2-4 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  { id: '3', name: 'HbA1c (Glycated Hemoglobin)', category: 'Diabetes Tests', code: 'HBA001', description: 'Average blood sugar over 2-3 months', price: 600, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Lipid Profile
  { id: '4', name: 'Lipid Profile', category: 'Lipid Profile', code: 'LIP001', description: 'Cholesterol, HDL, LDL, Triglycerides', price: 800, duration: '4-6 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  { id: '5', name: 'Total Cholesterol', category: 'Lipid Profile', code: 'CHO001', description: 'Total cholesterol levels in blood', price: 300, duration: '2-4 hours', preparationRequired: true, fastingRequired: true, sampleType: 'Blood' },
  
  // Liver Function Tests
  { id: '6', name: 'Liver Function Test (LFT)', category: 'Liver Function Tests', code: 'LFT001', description: 'Complete liver enzyme panel', price: 900, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '7', name: 'SGPT/ALT', category: 'Liver Function Tests', code: 'ALT001', description: 'Alanine aminotransferase enzyme test', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '8', name: 'SGOT/AST', category: 'Liver Function Tests', code: 'AST001', description: 'Aspartate aminotransferase enzyme test', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Kidney Function Tests
  { id: '9', name: 'Kidney Function Test (KFT)', category: 'Kidney Function Tests', code: 'KFT001', description: 'Complete kidney function assessment', price: 700, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '10', name: 'Serum Creatinine', category: 'Kidney Function Tests', code: 'CRE001', description: 'Kidney function marker', price: 300, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '11', name: 'Blood Urea Nitrogen (BUN)', category: 'Kidney Function Tests', code: 'BUN001', description: 'Kidney function and protein metabolism', price: 250, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Thyroid Tests
  { id: '12', name: 'Thyroid Function Test (TFT)', category: 'Thyroid Tests', code: 'TFT001', description: 'TSH, T3, T4 complete panel', price: 1200, duration: '6-8 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '13', name: 'TSH (Thyroid Stimulating Hormone)', category: 'Thyroid Tests', code: 'TSH001', description: 'Primary thyroid function marker', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '14', name: 'T3 (Triiodothyronine)', category: 'Thyroid Tests', code: 'T3001', description: 'Active thyroid hormone', price: 450, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '15', name: 'T4 (Thyroxine)', category: 'Thyroid Tests', code: 'T4001', description: 'Main thyroid hormone', price: 450, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Cardiac Tests
  { id: '16', name: 'ECG (Electrocardiogram)', category: 'Cardiac Tests', code: 'ECG001', description: 'Heart rhythm and electrical activity', price: 500, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  { id: '17', name: 'Troponin I', category: 'Cardiac Tests', code: 'TRP001', description: 'Heart attack marker', price: 800, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '18', name: 'CK-MB', category: 'Cardiac Tests', code: 'CKMB001', description: 'Heart muscle enzyme', price: 600, duration: '2-4 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Urine Tests
  { id: '19', name: 'Urine Routine & Microscopy', category: 'Urine Tests', code: 'URI001', description: 'Complete urine analysis', price: 300, duration: '2-4 hours', preparationRequired: true, fastingRequired: false, sampleType: 'Urine' },
  { id: '20', name: 'Urine Culture & Sensitivity', category: 'Urine Tests', code: 'UCS001', description: 'Bacterial infection and antibiotic sensitivity', price: 600, duration: '24-48 hours', preparationRequired: true, fastingRequired: false, sampleType: 'Urine' },
  
  // Imaging Tests
  { id: '21', name: 'Chest X-Ray', category: 'Imaging Tests', code: 'CXR001', description: 'Chest and lung examination', price: 800, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  { id: '22', name: 'Abdominal Ultrasound', category: 'Imaging Tests', code: 'USG001', description: 'Abdominal organs examination', price: 1500, duration: '30-45 minutes', preparationRequired: true, fastingRequired: true, sampleType: 'None' },
  { id: '23', name: 'CT Scan (Head)', category: 'Imaging Tests', code: 'CT001', description: 'Detailed brain imaging', price: 4000, duration: '30 minutes', preparationRequired: false, fastingRequired: false, sampleType: 'None' },
  
  // Vitamin & Mineral Tests
  { id: '24', name: 'Vitamin D (25-OH)', category: 'Vitamin & Mineral Tests', code: 'VD001', description: 'Vitamin D deficiency screening', price: 1000, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '25', name: 'Vitamin B12', category: 'Vitamin & Mineral Tests', code: 'VB12001', description: 'B12 deficiency screening', price: 800, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '26', name: 'Iron Studies', category: 'Vitamin & Mineral Tests', code: 'IRN001', description: 'Iron, TIBC, Ferritin panel', price: 1200, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  
  // Infection Tests
  { id: '27', name: 'HIV 1 & 2', category: 'Infection Tests', code: 'HIV001', description: 'HIV screening test', price: 600, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '28', name: 'Hepatitis B Surface Antigen', category: 'Infection Tests', code: 'HBS001', description: 'Hepatitis B screening', price: 400, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' },
  { id: '29', name: 'Hepatitis C Antibody', category: 'Infection Tests', code: 'HCV001', description: 'Hepatitis C screening', price: 800, duration: '4-6 hours', preparationRequired: false, fastingRequired: false, sampleType: 'Blood' }
];

export const LAB_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];
