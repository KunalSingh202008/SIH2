import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  UserCheck,
  Check,
  Copy,
  Calendar,
  FileCheck2,
  Layers,
} from 'lucide-react';
import { LanguageCode, SavedPdfReport, ScreeningResult, User } from '../types';
import { getTranslation } from '../services/translations';
import {
  getSavedPdfReports,
  reDownloadSavedReport,
  deleteSavedPdfReport,
  saveReportToProfile,
} from '../services/reportHistoryService';

interface PastPdfReportsSectionProps {
  currentResult: ScreeningResult;
  currentUser: User | null;
  currentLanguage: LanguageCode;
  selectedReportId?: string | null;
  onSelectReportToView: (report: SavedPdfReport) => void;
  onPreviewPdf: (result: ScreeningResult) => void;
  onBackToLatest?: () => void;
  isViewingHistorical?: boolean;
}

export const PastPdfReportsSection: React.FC<PastPdfReportsSectionProps> = ({
  currentResult,
  currentUser,
  currentLanguage,
  selectedReportId,
  onSelectReportToView,
  onPreviewPdf,
  onBackToLatest,
  isViewingHistorical = false,
}) => {
  const [reports, setReports] = useState<SavedPdfReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPattern, setFilterPattern] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = (key: string) => getTranslation(currentLanguage, key);

  // Load and subscribe to reports
  const refreshReports = () => {
    const loaded = getSavedPdfReports(currentUser?.id, currentUser?.fullName);
    setReports(loaded);
  };

  useEffect(() => {
    refreshReports();

    const handleUpdate = () => refreshReports();
    window.addEventListener('streesure_pdf_reports_updated', handleUpdate);
    return () => window.removeEventListener('streesure_pdf_reports_updated', handleUpdate);
  }, [currentUser?.id, currentUser?.fullName]);

  // Handle re-downloading a specific report
  const handleReDownload = async (report: SavedPdfReport) => {
    setDownloadingReportId(report.id);
    try {
      const { success } = await reDownloadSavedReport(report, currentUser, currentLanguage);
      if (success) {
        setDownloadSuccessId(report.id);
        refreshReports();
        setTimeout(() => setDownloadSuccessId(null), 4000);
      }
    } catch (err) {
      console.error('Error re-downloading PDF report:', err);
    } finally {
      setDownloadingReportId(null);
    }
  };

  // Handle saving current result explicitly if not present
  const handleSaveCurrentToProfile = () => {
    saveReportToProfile({
      result: currentResult,
      currentUser,
      currentLanguage,
      wasDownloaded: false,
    });
    refreshReports();
  };

  const handleDelete = (reportId: string) => {
    if (confirm('Are you sure you want to remove this assessment report from your profile history?')) {
      deleteSavedPdfReport(reportId, currentUser?.id);
      refreshReports();
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.levelTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.formattedDate.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterPattern === 'ALL' || rep.pcosPattern === filterPattern;

      return matchesSearch && matchesFilter;
    });
  }, [reports, searchQuery, filterPattern]);

  const totalDownloads = useMemo(() => {
    return reports.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);
  }, [reports]);

  const patternBadge = (pattern: 'LOW' | 'MODERATE' | 'HIGH') => {
    switch (pattern) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Low Pattern Signal',
          icon: CheckCircle2,
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Moderate Pattern Signal',
          icon: AlertCircle,
        };
      case 'HIGH':
      default:
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Higher Pattern Signal',
          icon: AlertTriangle,
        };
    }
  };

  return (
    <div id="past-pdf-reports-history" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <History className="w-3.5 h-3.5" />
            <span>User Profile Health Archive</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            Past PDF Reports & Assessment History
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            All clinical screenings and generated PDF diagnostic reports are preserved in your profile. Review your historical progression or re-download official multi-page reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isViewingHistorical && onBackToLatest && (
            <button
              type="button"
              onClick={onBackToLatest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Back to Latest Assessment</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveCurrentToProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
            title="Ensure the active assessment is archived in your profile"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Save Current to Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Sync Info & Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <UserCheck className="w-3.5 h-3.5 text-rose-600" />
            <span>Profile Owner</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {currentUser?.fullName || 'Sunita Sharma'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            ID: {currentUser?.id || 'usr_demo_01'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Saved Assessments</span>
          </div>
          <div className="text-sm font-black text-slate-900">
            {reports.length} Clinical Records
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            ✓ Auto-synced in profile
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <Download className="w-3.5 h-3.5 text-pink-600" />
            <span>PDF Downloads</span>
          </div>
          <div className="text-sm font-black text-slate-900">
            {totalDownloads} Generated
          </div>
          <div className="text-[11px] text-slate-400">
            Unlimited re-downloads
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Archive Range</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {reports.length > 0 ? reports[reports.length - 1]?.formattedDate.split('•')[0] : 'Today'}
          </div>
          <div className="text-[11px] text-slate-400">
            to {reports[0]?.formattedDate.split('•')[0] || 'Present'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports by ID, date, or clinical finding..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-rose-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap px-1">Pattern:</span>
          {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterPattern(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterPattern === filter
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'ALL' ? 'All Reports' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* List of Historical Reports */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No matching assessment reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or filter. You can also save your current screening result to your profile right now.
          </p>
          <button
            type="button"
            onClick={handleSaveCurrentToProfile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Save Active Assessment</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isCurrentlyActive =
              (selectedReportId && report.id === selectedReportId) ||
              (!selectedReportId && report.screeningId === currentResult.id);

            const badge = patternBadge(report.pcosPattern);
            const BadgeIcon = badge.icon;
            const isDownloading = downloadingReportId === report.id;
            const isDownloaded = downloadSuccessId === report.id;

            return (
              <div
                key={report.id}
                className={`relative rounded-2xl p-5 sm:p-6 transition border ${
                  isCurrentlyActive
                    ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-200 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Top metadata row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Report ID pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{report.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(report.id)}
                        className="p-0.5 hover:text-rose-600 transition"
                        title="Copy Report Reference ID"
                      >
                        {copiedId === report.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.formattedDate}</span>
                    </div>

                    {/* Active pill */}
                    {isCurrentlyActive && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        <Check className="w-3 h-3" />
                        Currently Viewing
                      </span>
                    )}
                  </div>

                  {/* Downloads count tag */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {report.downloadCount > 0
                        ? `Downloaded ${report.downloadCount}×`
                        : 'Archived in Profile'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(report.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  {/* Left info */}
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </div>

                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                        Score: {report.overallScore}/100
                      </span>

                      {report.language && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {report.language.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {report.levelTitle}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {report.summary}
                    </p>

                    {/* Filename subtext */}
                    <div className="text-[11px] font-mono text-slate-400 truncate pt-1">
                      File: {report.filename}
                    </div>
                  </div>

                  {/* Right action buttons */}
                  <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
                    {/* Re-download PDF Button */}
                    <button
                      type="button"
                      id={`btn-redownload-${report.id}`}
                      onClick={() => handleReDownload(report)}
                      disabled={isDownloading}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        isDownloaded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating PDF…</span>
                        </>
                      ) : isDownloaded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Re-download PDF</span>
                        </>
                      )}
                    </button>

                    {/* View Assessment or Preview PDF */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`btn-view-assessment-${report.id}`}
                        onClick={() => onSelectReportToView(report)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                        title="View the full interactive breakdown for this historical assessment"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-preview-pdf-${report.id}`}
                        onClick={() => onPreviewPdf(report.result)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition"
                        title="Preview the official multi-page PDF modal"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
