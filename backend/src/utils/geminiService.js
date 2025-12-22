const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

// Initialize Gemini AI with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Extract medical data from report using Gemini AI
 * @param {string} cloudinaryUrl - URL of the uploaded report
 * @param {string} reportType - Type of medical report
 * @returns {Object} Extracted medical data
 */
const extractMedicalData = async (cloudinaryUrl, reportType = 'general') => {
  try {
    // Download file from Cloudinary
    const response = await axios.get(cloudinaryUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    });

    const fileBuffer = Buffer.from(response.data);
    
    // Determine MIME type from URL or headers
    let mimeType = 'application/pdf'; // Default
    if (cloudinaryUrl.includes('.pdf')) {
      mimeType = 'application/pdf';
    } else if (cloudinaryUrl.includes('.png')) {
      mimeType = 'image/png';
    } else if (cloudinaryUrl.includes('.jpg') || cloudinaryUrl.includes('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (response.headers['content-type'] && 
               response.headers['content-type'] !== 'application/octet-stream') {
      mimeType = response.headers['content-type'];
    }

    console.log('File MIME type:', mimeType);

    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64');

    // Prepare the file for Gemini
    const filePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    // Create a detailed prompt based on report type
    const prompt = createPromptForReportType(reportType);

    // Use Gemini 2.5 Flash (new version)
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            filePart
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      }
    });

    const response_text = result.text;

    // Parse the JSON response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response_text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(response_text);
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Return raw text if JSON parsing fails
      extractedData = {
        rawText: response_text,
        parsingError: true
      };
    }

    return {
      success: true,
      data: extractedData,
      aiProcessed: true
    };

  } catch (error) {
    console.error('Gemini AI extraction error:', error);
    return {
      success: false,
      error: error.message,
      aiProcessed: false,
      data: {}
    };
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

/**
 * Validate and structure extracted data
 */
const structureExtractedData = (extractedData, reportType) => {
  // Convert extracted data to a flat structure for easier storage
  const structured = {};
  const metrics = {};

  // Common metrics mapping - extended list
  const metricKeys = [
    'hemoglobin', 'bloodSugar', 'glucose', 'cholesterol', 
    'bloodPressure', 'heartRate', 'temperature', 'weight', 
    'height', 'bmi', 'cholesterolTotal', 'cholesterolLDL', 
    'cholesterolHDL', 'triglycerides', 'hba1c', 'fastingBloodSugar',
    'randomBloodSugar', 'postprandialBloodSugar', 'rbc', 'wbc',
    'platelet', 'hematocrit', 'sgot', 'sgpt', 'ast', 'alt',
    'creatinine', 'urea', 'uricAcid', 'bun', 'tsh', 't3', 't4',
    'sodium', 'potassium', 'calcium', 'vitaminD', 'vitaminB12',
    'iron', 'ferritin'
  ];

  for (const [key, value] of Object.entries(extractedData)) {
    const lowerKey = key.toLowerCase();
    
    // Check if it's a common metric
    if (metricKeys.some(metric => lowerKey.includes(metric.toLowerCase()))) {
      metrics[key] = String(value);
    }
    
    structured[key] = String(value);
  }

  return { structured, metrics };
};

module.exports = {
  extractMedicalData,
  structureExtractedData,
  createPromptForReportType
};
