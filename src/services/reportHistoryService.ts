import { LanguageCode, SavedPdfReport, ScreeningResult, User } from '../types';
import { calculateScreeningResult, defaultMockScreeningAnswers } from './screeningEngine';
import { generateScreeningPdfReport } from './pdfReportGenerator';

const STORAGE_PREFIX = 'streesure_pdf_reports_';

export function getReportStorageKey(userId?: string | null): string {
  if (!userId || userId === 'usr_default' || userId === 'guest') {
    return `${STORAGE_PREFIX}usr_demo_01`;
  }
  return `${STORAGE_PREFIX}${userId}`;
}

export function formatReportTimestamp(dateInput?: string | Date, lang: LanguageCode = 'en'): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString();

  return d.toLocaleDateString(lang === 'en' ? 'en-IN' : undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function generateReportId(screeningId?: string): string {
  if (screeningId && screeningId.length >= 4) {
    const clean = screeningId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `STR-REP-${clean.slice(-6)}`;
  }
  return `STR-REP-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateReportFilename(reportId: string): string {
  return `StreeSure_Health_Assessment_Report_${reportId}.pdf`;
}

/**
 * Creates initial demo historical reports for realistic evaluation and comparison
 */
function createInitialSeedReports(userId: string = 'usr_demo_01', userName: string = 'Sunita Sharma'): SavedPdfReport[] {
  // Report 1: 3 months ago (Moderate Concern - June 2026)
  const date1 = new Date();
  date1.setMonth(date1.getMonth() - 3);
  date1.setDate(14);
  date1.setHours(11, 30, 0, 0);

  const answers1 = {
    ...defaultMockScreeningAnswers,
    cycleRegularity: 'infrequent_over_35' as const,
    daysBetweenPeriods: 38,
    increasedFacialHair: 'mild' as const,
    persistentAcne: 'mild_occasional' as const,
    unexplainedWeightGain: 'moderate' as const,
    physicalActivityLevel: 'moderate_1_2_days' as const,
  };

  const result1: ScreeningResult = calculateScreeningResult(userId, answers1);
  result1.id = 'scr_hist_01';
  result1.date = date1.toISOString();
  result1.createdAt = date1.toISOString();
  result1.overallScore = 48;
  result1.level = 'ORANGE';
  result1.pcosPattern = 'MODERATE';
  result1.levelTitle = 'Moderate PCOS Pattern Indicated';
  result1.levelDescription = 'Moderate cycle variability (38-day intervals) and mild androgenic traits detected.';

  const reportId1 = 'STR-REP-842103';
  const item1: SavedPdfReport = {
    id: reportId1,
    screeningId: result1.id,
    userId,
    userName,
    createdAt: date1.toISOString(),
    formattedDate: formatReportTimestamp(date1, 'en'),
    filename: generateReportFilename(reportId1),
    overallScore: 48,
    level: 'ORANGE',
    pcosPattern: 'MODERATE',
    levelTitle: result1.levelTitle,
    summary: 'Moderate cycle length variation with mild facial hair & acne signs. Lifestyle modifications recommended.',
    language: 'hi',
    result: result1,
    aiExplanation: 'Your cycle lengths varied between 35 and 42 days, suggesting mild ovulatory delays with insulin sensitivity factors.',
    downloadCount: 1,
    lastDownloadedAt: date1.toISOString(),
    status: 'DOWNLOADED',
  };

  // Report 2: 6 months ago (Higher Concern - March 2026)
  const date2 = new Date();
  date2.setMonth(date2.getMonth() - 6);
  date2.setDate(8);
  date2.setHours(16, 45, 0, 0);

  const answers2 = {
    ...defaultMockScreeningAnswers,
    cycleRegularity: 'absent_3_months_plus' as const,
    daysBetweenPeriods: 52,
    increasedFacialHair: 'moderate_to_severe' as const,
    persistentAcne: 'persistent_adult_cystic' as const,
    scalpHairThinning: 'mild_shedding' as const,
    unexplainedWeightGain: 'significant_difficulty_losing' as const,
    physicalActivityLevel: 'sedentary' as const,
    sleepQuality: 'poor_insomnia_apnea' as const,
  };

  const result2: ScreeningResult = calculateScreeningResult(userId, answers2);
  result2.id = 'scr_hist_02';
  result2.date = date2.toISOString();
  result2.createdAt = date2.toISOString();
  result2.overallScore = 68;
  result2.level = 'RED';
  result2.pcosPattern = 'HIGH';
  result2.levelTitle = 'Higher PCOS Pattern Identified';
  result2.levelDescription = 'Multiple Rotterdam criteria indicators reported. Proactive clinical teleconsult recommended.';

  const reportId2 = 'STR-REP-719520';
  const item2: SavedPdfReport = {
    id: reportId2,
    screeningId: result2.id,
    userId,
    userName,
    createdAt: date2.toISOString(),
    formattedDate: formatReportTimestamp(date2, 'en'),
    filename: generateReportFilename(reportId2),
    overallScore: 68,
    level: 'RED',
    pcosPattern: 'HIGH',
    levelTitle: result2.levelTitle,
    summary: 'Infrequent menstrual cycles exceeding 50 days with moderate hirsutism and elevated metabolic markers.',
    language: 'hi',
    result: result2,
    aiExplanation: 'Primary indicators align with classic hyperandrogenic and ovulatory dysfunction. Recommended comprehensive pelvic ultrasound.',
    downloadCount: 2,
    lastDownloadedAt: date2.toISOString(),
    status: 'DOWNLOADED',
  };

  return [item1, item2];
}

/**
 * Retrieves all saved PDF reports for a user profile
 */
export function getSavedPdfReports(userId?: string | null, userName?: string): SavedPdfReport[] {
  const key = getReportStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: SavedPdfReport[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    }

    // If nothing exists yet, seed initial demo history for standard users/guests
    const initialSeed = createInitialSeedReports(userId || 'usr_demo_01', userName || 'Sunita Sharma');
    localStorage.setItem(key, JSON.stringify(initialSeed));
    return initialSeed;
  } catch (err) {
    console.warn('Error reading saved PDF reports from localStorage:', err);
    return createInitialSeedReports(userId || 'usr_demo_01', userName || 'Sunita Sharma');
  }
}

export interface SaveReportParams {
  result: ScreeningResult;
  currentUser: User | null;
  currentLanguage: LanguageCode;
  aiExplanation?: string;
  wasDownloaded?: boolean;
  filename?: string;
}

/**
 * Saves or updates a PDF report in the user profile history
 */
export function saveReportToProfile(params: SaveReportParams): SavedPdfReport {
  const { result, currentUser, currentLanguage, aiExplanation, wasDownloaded = false, filename } = params;
  const userId = currentUser?.id || result.userId || 'usr_demo_01';
  const userName = currentUser?.fullName || 'Sunita Sharma';
  const key = getReportStorageKey(userId);

  const existingReports = getSavedPdfReports(userId, userName);

  // Check if a report with this screeningId already exists
  const existingIdx = existingReports.findIndex(
    (r) => r.screeningId === result.id || (result.id && r.id.includes(result.id.slice(-6).toUpperCase()))
  );

  const reportId = existingIdx >= 0
    ? existingReports[existingIdx].id
    : generateReportId(result.id);

  const finalFilename = filename || (existingIdx >= 0 ? existingReports[existingIdx].filename : generateReportFilename(reportId));

  const pcosPattern =
    result.pcosPattern || (result.overallScore >= 55 ? 'HIGH' : result.overallScore >= 28 ? 'MODERATE' : 'LOW');

  const nowIso = new Date().toISOString();

  let savedReport: SavedPdfReport;

  if (existingIdx >= 0) {
    const prev = existingReports[existingIdx];
    savedReport = {
      ...prev,
      result,
      overallScore: result.overallScore,
      level: result.level,
      pcosPattern,
      levelTitle: result.levelTitle,
      summary: result.levelDescription || prev.summary,
      aiExplanation: aiExplanation || prev.aiExplanation,
      language: currentLanguage,
      filename: finalFilename,
      downloadCount: wasDownloaded ? prev.downloadCount + 1 : prev.downloadCount,
      lastDownloadedAt: wasDownloaded ? nowIso : prev.lastDownloadedAt,
      status: wasDownloaded ? 'DOWNLOADED' : prev.status,
    };
    existingReports[existingIdx] = savedReport;
  } else {
    savedReport = {
      id: reportId,
      screeningId: result.id || `scr_${Date.now()}`,
      userId,
      userName,
      createdAt: result.createdAt || result.date || nowIso,
      formattedDate: formatReportTimestamp(result.createdAt || result.date || nowIso, currentLanguage),
      filename: finalFilename,
      overallScore: result.overallScore,
      level: result.level,
      pcosPattern,
      levelTitle: result.levelTitle,
      summary: result.levelDescription || 'StreeSure Clinical Health Assessment and Risk Stratification Report.',
      language: currentLanguage,
      result,
      aiExplanation,
      downloadCount: wasDownloaded ? 1 : 0,
      lastDownloadedAt: wasDownloaded ? nowIso : undefined,
      status: wasDownloaded ? 'DOWNLOADED' : 'SAVED',
    };
    existingReports.unshift(savedReport);
  }

  // Persist back to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(existingReports));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streesure_pdf_reports_updated', { detail: { reportId, userId } }));
    }
  } catch (e) {
    console.error('Failed to write report to profile history:', e);
  }

  return savedReport;
}

/**
 * Records a successful PDF download in user profile history
 */
export function recordReportDownload(
  reportId: string,
  userId?: string | null,
  filename?: string
): SavedPdfReport | null {
  const effectiveUserId = userId || 'usr_demo_01';
  const key = getReportStorageKey(effectiveUserId);
  const reports = getSavedPdfReports(effectiveUserId);

  const idx = reports.findIndex((r) => r.id === reportId || r.screeningId === reportId);
  if (idx < 0) return null;

  const nowIso = new Date().toISOString();
  reports[idx] = {
    ...reports[idx],
    downloadCount: (reports[idx].downloadCount || 0) + 1,
    lastDownloadedAt: nowIso,
    status: 'DOWNLOADED',
    filename: filename || reports[idx].filename,
  };

  try {
    localStorage.setItem(key, JSON.stringify(reports));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streesure_pdf_reports_updated', { detail: { reportId, userId: effectiveUserId } }));
    }
  } catch (e) {
    console.error('Failed to record PDF download:', e);
  }

  return reports[idx];
}

/**
 * Removes a report from profile history
 */
export function deleteSavedPdfReport(reportId: string, userId?: string | null): boolean {
  const effectiveUserId = userId || 'usr_demo_01';
  const key = getReportStorageKey(effectiveUserId);
  const reports = getSavedPdfReports(effectiveUserId);

  const filtered = reports.filter((r) => r.id !== reportId && r.screeningId !== reportId);
  if (filtered.length === reports.length) return false;

  try {
    localStorage.setItem(key, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('streesure_pdf_reports_updated', { detail: { reportId, userId: effectiveUserId } }));
    }
    return true;
  } catch (e) {
    console.error('Failed to delete report:', e);
    return false;
  }
}

/**
 * Re-downloads any previous assessment PDF report with 1-click
 */
export async function reDownloadSavedReport(
  report: SavedPdfReport,
  currentUser: User | null,
  currentLanguage: LanguageCode
): Promise<{ success: boolean; filename: string }> {
  const userForPdf: User = currentUser || {
    id: report.userId,
    fullName: report.userName || 'Sunita Sharma',
    email: 'user@streesure.org',
    phone: '+91 98765 43210',
    role: 'USER',
    preferredLanguage: report.language || currentLanguage,
    createdAt: report.createdAt,
  };

  const response = await generateScreeningPdfReport({
    result: report.result,
    currentUser: userForPdf,
    currentLanguage: report.language || currentLanguage,
    aiExplanation: report.aiExplanation,
  });

  if (response.success) {
    recordReportDownload(report.id, report.userId, response.filename);
  }

  return response;
}
