const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const mimeType = response.headers['content-type'] || 'application/pdf';

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

    // Use Gemini 1.5 Flash model (free tier)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate content
    const result = await model.generateContent([prompt, filePart]);
    const response_text = result.response.text();

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

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.

Extract the following information if available:`;

  const specificPrompts = {
    'Blood Test': `${basePrompt}
- Patient name
- Test date
- Hemoglobin (with unit)
- RBC count
- WBC count
- Platelet count
- Blood sugar/Glucose (fasting, random, or HbA1c)
- Cholesterol (total, LDL, HDL, triglycerides)
- Liver function (SGOT, SGPT, bilirubin)
- Kidney function (creatinine, urea, uric acid)
- Thyroid (TSH, T3, T4)
- Any other blood parameters
- Normal ranges mentioned
- Any abnormal values highlighted

Return JSON format like:
{
  "patientName": "...",
  "testDate": "...",
  "hemoglobin": "13.5 g/dL",
  "bloodSugar": "95 mg/dL",
  "cholesterolTotal": "180 mg/dL",
  "notes": "..."
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

  // Common metrics mapping
  const metricKeys = [
    'hemoglobin', 'bloodSugar', 'glucose', 'cholesterol', 
    'bloodPressure', 'heartRate', 'temperature', 'weight', 
    'height', 'bmi', 'cholesterolTotal', 'cholesterolLDL', 
    'cholesterolHDL', 'triglycerides'
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
