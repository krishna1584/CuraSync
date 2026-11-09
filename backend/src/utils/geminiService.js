const { GoogleGenAI } = require('@google/genai');

let client = null;
const getClient = () => {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const READ_FAILED = 'AI could not read this file';

/**
 * Extract medical data from an uploaded report using Gemini AI.
 * @param {{buffer: Buffer, mimeType: string}} file - The uploaded file
 * @param {string} reportType - Type of medical report
 * @returns {Object} { success, data } or { success: false, error }
 */
const extractMedicalData = async (file, reportType = 'general') => {
  if (!process.env.GEMINI_API_KEY) {
    return { success: false, error: 'AI extraction is not set up on the server', aiProcessed: false, data: {} };
  }

  try {
    const result = await getClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: createPromptForReportType(reportType) },
            { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimeType } }
          ]
        }
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        // Plain extraction doesn't need reasoning, and thinking tokens would eat the output limit.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const text = result.text;
    if (!text) {
      console.error('Gemini returned no text. Finish reason:', result.candidates?.[0]?.finishReason);
      return { success: false, error: READ_FAILED, aiProcessed: false, data: {} };
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { success: false, error: READ_FAILED, aiProcessed: false, data: {} };
    }

    return { success: true, data, aiProcessed: true };
  } catch (error) {
    console.error('Gemini AI extraction error:', error.message);
    return { success: false, error: READ_FAILED, aiProcessed: false, data: {} };
  }
};

/**
 * Create appropriate prompt based on report type
 */
const createPromptForReportType = (reportType) => {
  const basePrompt = `You are a medical data extraction specialist. Analyze this medical report and extract ALL relevant medical data into a structured JSON format.

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON, no additional text or explanation.
2. Extract ALL visible data including patient info, test parameters, values, units, and ranges.
3. Use camelCase for field names (e.g., "patientName", "bloodSugar", "cholesterolTotal").
4. Include units with values when available (e.g., "13.5 g/dL", "95 mg/dL").
5. Preserve exact values and ranges from the report.
6. If a value is marked as abnormal, note it in the value or add a "notes" field.

Extract the following information if available:`;

  const specificPrompts = {
    'Blood Test': `${basePrompt}
- Patient name and demographics (age, gender if available)
- Test date and lab name
- Complete Blood Count (CBC):
  - Hemoglobin (with unit and normal range)
  - RBC count
  - WBC count
  - Platelet count
  - Hematocrit
  - MCV, MCH, MCHC
- Blood Sugar/Glucose:
  - Fasting glucose
  - Random glucose
  - HbA1c
  - Postprandial glucose
- Lipid Profile:
  - Total cholesterol
  - LDL cholesterol
  - HDL cholesterol
  - Triglycerides
  - VLDL
- Liver Function Tests (LFT):
  - SGOT/AST
  - SGPT/ALT
  - Bilirubin (total, direct, indirect)
  - Alkaline phosphatase
  - Total protein, albumin, globulin
- Kidney Function Tests (KFT):
  - Creatinine
  - Blood urea nitrogen (BUN)
  - Uric acid
  - Urea
- Thyroid Function:
  - TSH
  - T3 (total and free)
  - T4 (total and free)
- Electrolytes:
  - Sodium
  - Potassium
  - Chloride
  - Calcium
- Vitamins and minerals:
  - Vitamin D
  - Vitamin B12
  - Iron, TIBC, Ferritin
- Any other parameters visible in the report
- Normal ranges for each parameter
- Flagged abnormal values (mark with "H" for high, "L" for low if indicated)
- Doctor's notes, impressions, or recommendations

Return JSON format like:
{
  "patientName": "John Doe",
  "age": "45 years",
  "gender": "Male",
  "testDate": "2024-01-15",
  "labName": "City Diagnostics",
  "hemoglobin": "13.5 g/dL",
  "hemoglobinRange": "13-17 g/dL",
  "hemoglobinStatus": "Normal",
  "fastingBloodSugar": "95 mg/dL",
  "fastingBloodSugarRange": "70-100 mg/dL",
  "cholesterolTotal": "180 mg/dL",
  "cholesterolTotalRange": "<200 mg/dL",
  "ldlCholesterol": "110 mg/dL (H)",
  "hdlCholesterol": "45 mg/dL",
  "triglycerides": "150 mg/dL",
  "sgotAst": "35 U/L",
  "sgptAlt": "40 U/L",
  "creatinine": "1.0 mg/dL",
  "notes": "LDL cholesterol slightly elevated. Recommend dietary modifications.",
  "impression": "Borderline dyslipidemia"
}`,

    'X-Ray': `${basePrompt}
- Patient name
- Test date
- Body part examined
- Findings/observations
- Radiologist comments
- Any abnormalities detected
- Impression/conclusion

Return JSON format like:
{
  "patientName": "...",
  "testDate": "...",
  "bodyPart": "Chest",
  "findings": "...",
  "impression": "..."
}`,

    'MRI': `${basePrompt}
- Patient name
- Test date
- Body part/region scanned
- Technique used
- Findings
- Radiologist impression
- Any abnormalities

Return JSON format like:
{
  "patientName": "...",
  "testDate": "...",
  "region": "Brain",
  "findings": "...",
  "impression": "..."
}`,

    'Urine Test': `${basePrompt}
- Patient name
- Test date
- Color and appearance
- pH level
- Specific gravity
- Protein
- Glucose
- Ketones
- Blood/RBC
- WBC
- Any other parameters
- Microscopic examination results

Return JSON format.`,

    'ECG': `${basePrompt}
- Patient name
- Test date
- Heart rate
- Rhythm
- PR interval
- QRS duration
- QT interval
- Interpretation
- Any abnormalities

Return JSON format.`,

    'default': `${basePrompt}
- Patient name
- Test/report date
- Type of test/examination
- All test parameters with values and units
- Doctor's notes or impressions
- Any abnormal findings
- Recommendations

Return ONLY valid JSON format with extracted data.`
  };

  return specificPrompts[reportType] || specificPrompts['default'];
};

// Standard metric name -> the labels reports use for it (lower case, letters and digits only).
const METRIC_ALIASES = {
  hemoglobin: ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'hemoglobinhb', 'haemoglobinhb', 'hemoglobinhgb'],
  bloodSugar: ['bloodsugar', 'glucose', 'fastingglucose', 'fastingbloodsugar', 'fastingbloodglucose', 'fbs',
    'randomglucose', 'randombloodsugar', 'rbs', 'postprandialglucose', 'postprandialbloodsugar', 'ppbs'],
  hba1c: ['hba1c', 'glycatedhemoglobin', 'glycatedhaemoglobin'],
  cholesterol: ['cholesterol', 'totalcholesterol', 'cholesteroltotal'],
  ldl: ['ldl', 'ldlcholesterol', 'cholesterolldl'],
  hdl: ['hdl', 'hdlcholesterol', 'cholesterolhdl'],
  triglycerides: ['triglycerides', 'triglyceride'],
  bloodPressure: ['bloodpressure', 'bp'],
  heartRate: ['heartrate', 'pulse', 'pulserate'],
  temperature: ['temperature', 'bodytemperature'],
  weight: ['weight', 'bodyweight'],
  height: ['height'],
  bmi: ['bmi', 'bodymassindex'],
  rbc: ['rbc', 'rbccount', 'redbloodcells', 'redbloodcellcount'],
  wbc: ['wbc', 'wbccount', 'whitebloodcells', 'whitebloodcellcount', 'tlc', 'totalleukocytecount'],
  platelets: ['platelets', 'platelet', 'plateletcount'],
  hematocrit: ['hematocrit', 'haematocrit', 'hct', 'pcv'],
  sgot: ['sgot', 'ast', 'sgotast', 'astsgot'],
  sgpt: ['sgpt', 'alt', 'sgptalt', 'altsgpt'],
  creatinine: ['creatinine', 'serumcreatinine'],
  urea: ['urea', 'bloodurea', 'serumurea'],
  bun: ['bun', 'bloodureanitrogen'],
  uricAcid: ['uricacid', 'serumuricacid'],
  tsh: ['tsh', 'thyroidstimulatinghormone'],
  t3: ['t3', 'triiodothyronine', 'totalt3'],
  t4: ['t4', 'thyroxine', 'totalt4'],
  sodium: ['sodium'],
  potassium: ['potassium'],
  calcium: ['calcium', 'serumcalcium'],
  vitaminD: ['vitamind', 'vitamind3', '25ohvitamind'],
  vitaminB12: ['vitaminb12', 'b12'],
  iron: ['iron', 'serumiron'],
  ferritin: ['ferritin', 'serumferritin']
};

const METRIC_BY_LABEL = new Map(
  Object.entries(METRIC_ALIASES).flatMap(([metric, labels]) => labels.map((label) => [label, metric]))
);

const normalizeLabel = (label) => String(label).toLowerCase().replace(/[^a-z0-9]/g, '');
// MongoDB map keys cannot contain dots or start with "$".
const safeKey = (key) => String(key).trim().replace(/[.$]/g, '_');
const isEmpty = (value) => value === null || value === undefined || value === '';
const isPlainValue = (value) => ['string', 'number', 'boolean'].includes(typeof value);

const VALUE_FIELDS = ['value', 'result'];
const LABEL_FIELDS = ['name', 'test', 'testName', 'parameter', 'parameterName', 'analyte'];
const RANGE_FIELDS = ['normalRange', 'referenceRange', 'range', 'normal'];
const firstField = (object, fields) => fields.map((field) => object[field]).find((value) => !isEmpty(value));

const SUMMARY_FIELDS = ['summary', 'impression', 'interpretation', 'conclusion', 'notes', 'findings'];

/**
 * Turn the AI's JSON (often nested, e.g. { cbc: { hemoglobin: { value, unit } } }) into flat
 * text fields for display, plus key metrics under standard names.
 */
const structureExtractedData = (extractedData) => {
  const structured = {};
  const metrics = {};

  const record = (path, label, value) => {
    const text = String(value).trim();
    if (!text) return;
    structured[safeKey(path)] = text;
    const metric = METRIC_BY_LABEL.get(normalizeLabel(label));
    if (metric && !metrics[metric]) metrics[metric] = text;
  };

  const walk = (value, path, label) => {
    if (isEmpty(value)) return;

    if (isPlainValue(value)) {
      record(path, label, value);
      return;
    }

    if (Array.isArray(value)) {
      if (value.every(isPlainValue)) {
        if (value.length > 0) record(path, label, value.join(', '));
        return;
      }
      value.forEach((item, index) => {
        const itemLabel = item && typeof item === 'object' ? firstField(item, LABEL_FIELDS) : null;
        if (itemLabel) walk(item, String(itemLabel), String(itemLabel));
        else walk(item, `${path}_${index + 1}`, label);
      });
      return;
    }

    // A single reading: { value: 13.5, unit: "g/dL", normalRange: "13-17" }
    const reading = firstField(value, VALUE_FIELDS);
    if (isPlainValue(reading)) {
      record(path, label, value.unit ? `${reading} ${value.unit}` : reading);
      const range = firstField(value, RANGE_FIELDS);
      if (isPlainValue(range)) structured[safeKey(`${path}_range`)] = String(range);
      return;
    }

    Object.entries(value).forEach(([key, child]) => walk(child, path ? `${path}_${key}` : key, key));
  };

  walk(extractedData, '', '');

  const summaryValue = firstField(extractedData, SUMMARY_FIELDS);
  return { structured, metrics, summary: typeof summaryValue === 'string' ? summaryValue : '' };
};

module.exports = {
  extractMedicalData,
  structureExtractedData,
  createPromptForReportType
};
