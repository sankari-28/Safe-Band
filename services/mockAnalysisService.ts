import { ExposureAnalysisResult, AnalysisProgressStep, RiskLevel } from '../types';
import { api } from './api';

export const INITIAL_ANALYSIS_STEPS: AnalysisProgressStep[] = [
  { id: 1, title: 'Wristband strip detected', subtitle: 'Locating copper acetate sensing strip ROI', completed: false },
  { id: 2, title: 'Reference scale detected', subtitle: 'Normalizing light exposure & reference color palette', completed: false },
  { id: 3, title: 'Colour features extracted', subtitle: 'Computing OpenCV RGB + HSV + LAB color space delta', completed: false },
  { id: 4, title: 'H₂S level estimated', subtitle: 'Executing trained Random Forest regression model', completed: false },
];

/**
 * Live / Simulated exposure analysis service:
 * Worker Photo -> API Gateway (ai-analysis-service) -> OpenCV Color Extraction -> Random Forest Regression -> H2S ppm result
 */
export const runMockExposureAnalysis = async (
  calculateRisk: (ppm: number) => RiskLevel,
  onProgress?: (stepIndex: number) => void,
  imageUri?: string,
  workerId: string = 'W001'
): Promise<ExposureAnalysisResult> => {
  // Step 1
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (onProgress) onProgress(0);

  // Step 2
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (onProgress) onProgress(1);

  // Step 3
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (onProgress) onProgress(2);

  // Step 4
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (onProgress) onProgress(3);

  let simulatedPpm = 12;
  let simulatedDuration = 18;
  let confidence = 94;

  let riskCategory: string | undefined = undefined;
  let isMock = true;
  let sensorStatus: string | undefined = undefined;
  let retakeRequired = false;
  let warning: string | undefined = undefined;
  let message: string | undefined = undefined;

  if (imageUri) {
    const apiResult = await api.analyzeImage(imageUri, workerId);
    if (apiResult) {
      simulatedPpm = apiResult.h2sLevel;
      simulatedDuration = apiResult.exposureDuration;
      confidence = apiResult.confidence;
      riskCategory = apiResult.riskCategory;
      isMock = apiResult.isMock;
      sensorStatus = apiResult.sensorStatus;
      retakeRequired = apiResult.retakeRequired;
      warning = apiResult.warning || undefined;
      message = apiResult.message || undefined;
    }
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const risk = calculateRisk(simulatedPpm);

  return {
    h2sLevel: simulatedPpm,
    exposureDuration: simulatedDuration,
    confidence: confidence,
    timestamp: timeString,
    date: dateString,
    riskLevel: risk,
    riskCategory,
    isMock,
    sensorStatus,
    retakeRequired,
    warning,
    message,
  };
};

