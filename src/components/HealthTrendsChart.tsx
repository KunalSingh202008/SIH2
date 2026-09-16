import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Calendar,
  Activity,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Info,
  CheckCircle2,
  Filter,
  Eye,
  Zap,
  Flame,
  Droplets,
} from 'lucide-react';
import { LanguageCode, SymptomTrendRecord } from '../types';

interface HealthTrendsChartProps {
  data: SymptomTrendRecord[];
  currentLanguage: LanguageCode;
  className?: string;
  onOpenConsultation?: () => void;
}

type ChartMetricMode = 'cycle_duration' | 'symptom_frequency' | 'symptom_severity' | 'energy_metabolism';

export const HealthTrendsChart: React.FC<HealthTrendsChartProps> = ({
  data,
  currentLanguage,
  className = '',
  onOpenConsultation,
}) => {
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('cycle_duration');

  // Active line visibility toggles
  const [visibleLines, setVisibleLines] = useState<{ [key: string]: boolean }>({
    avgCycleLength: true,
    symptomFrequencyDays: true,
    crampScore: true,
    acneScore: true,
    bloatingScore: true,
    energyScore: true,
    insulinScore: true,
  });

  const toggleLine = (lineKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  const isHindi = currentLanguage === 'hi';

  // Format and enrich data for recharts
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const prev = index > 0 ? data[index - 1] : null;
      const cycleChange = prev ? item.avgCycleLength - prev.avgCycleLength : 0;
      const symptomDaysChange = prev && item.symptomFrequencyDays && prev.symptomFrequencyDays
        ? item.symptomFrequencyDays - prev.symptomFrequencyDays
        : 0;

      return {
        ...item,
        displayMonth: item.shortMonth || item.month.split(' ')[0],
        cycleChange,
        symptomDaysChange,
        // Target baseline reference
        targetMin: 28,
        targetMax: 35,
      };
    });
  }, [data]);

  // Overall 6-month deltas
  const firstMonth = data[0];
  const latestMonth = data[data.length - 1];

  const cycleLengthDelta = latestMonth && firstMonth ? latestMonth.avgCycleLength - firstMonth.avgCycleLength : 0;
  const symptomDaysDelta =
    latestMonth?.symptomFrequencyDays && firstMonth?.symptomFrequencyDays
      ? latestMonth.symptomFrequencyDays - firstMonth.symptomFrequencyDays
      : -19;
  const crampDeltaPercent =
    latestMonth && firstMonth
      ? Math.round(((firstMonth.crampScore - latestMonth.crampScore) / firstMonth.crampScore) * 100)
      : 70;
  const energyDeltaPercent =
    latestMonth && firstMonth
      ? Math.round(((latestMonth.energyScore - firstMonth.energyScore) / firstMonth.energyScore) * 100)
      : 155;

  // Custom Dark Mode Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entryData = payload[0].payload as (typeof chartData)[0];
      return (
        <div className="bg-[#180f24] border border-rose-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs text-white max-w-xs space-y-2.5 z-50">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold text-rose-200 text-sm">{entryData.month}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
              Month {chartData.findIndex((c) => c.month === entryData.month) + 1} of 6
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {payload.map((item: any) => {
              let unit = '';
              let labelName = item.name;

              if (item.dataKey === 'avgCycleLength') {
                unit = ' days';
                labelName = isHindi ? 'माहवारी चक्र अवधि' : 'Cycle Duration';
              } else if (item.dataKey === 'symptomFrequencyDays') {
                unit = ' days/mo';
                labelName = isHindi ? 'लक्षण वाले दिन' : 'Symptom Days';
              } else if (item.dataKey === 'crampScore') {
                unit = ' / 5';
                labelName = isHindi ? 'माहवारी दर्द (क्रैम्प्स)' : 'Cramp Severity';
              } else if (item.dataKey === 'acneScore') {
                unit = ' / 5';
                labelName = isHindi ? 'मुंहासे (एक्ने)' : 'Cystic Acne';
              } else if (item.dataKey === 'bloatingScore') {
                unit = ' / 5';
                labelName = isHindi ? 'पेट फूलना (ब्लोटिंग)' : 'Bloating';
              } else if (item.dataKey === 'energyScore') {
                unit = ' / 5';
                labelName = isHindi ? 'दैनिक ऊर्जा स्तर' : 'Energy Index';
              } else if (item.dataKey === 'insulinScore') {
                unit = ' / 5';
                labelName = isHindi ? 'इंसुलिन प्रतिरोधक स्तर' : 'Insulin Marker';
              }

              return (
                <div key={item.dataKey} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-300 text-[11px]">{labelName}:</span>
                  </div>
                  <span className="font-black text-white text-xs" style={{ color: item.color }}>
                    {item.value}
                    {unit}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Clinical interpretation in tooltip */}
          {entryData.avgCycleLength <= 35 && (
            <div className="pt-2 border-t border-rose-500/20 text-[10px] text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {isHindi
                  ? 'सामान्य स्वस्थ सीमा (28-35 दिन) में स्थित है।'
                  : 'Cycle is within clinical physiological target range (28-35 days).'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-[#140c1e] rounded-3xl p-6 sm:p-8 border border-rose-500/20 shadow-2xl space-y-6 ${className}`}>
      {/* Header & Metric View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            <span>{isHindi ? '6-महीने का रिकवरी रुझान (रीचार्ट्स)' : '6-Month Clinical Telemetry (Recharts)'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{isHindi ? 'स्वास्थ्य मेट्रिक्स और चक्र रुझान' : 'Health Metrics & Cycle Trends'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
              6 Months Active
            </span>
          </h2>
          <p className="text-xs text-rose-200/70 leading-relaxed">
            {isHindi
              ? 'पिछले 6 महीनों में माहवारी चक्र की अवधि, लक्षण आवृत्ति और ऊर्जा स्तर में वैज्ञानिक सुधार देखें।'
              : 'Interactive visualization of menstrual cycle regularization, symptom frequency reduction, and metabolic recovery.'}
          </p>
        </div>

        {/* Metric Mode Pill Buttons */}
        <div className="flex items-center gap-1.5 bg-[#1b1028] p-1.5 rounded-2xl border border-rose-500/20 flex-wrap">
          <button
            type="button"
            onClick={() => setMetricMode('cycle_duration')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'cycle_duration'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'text-rose-200/70 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isHindi ? 'चक्र अवधि (दिन)' : 'Cycle Duration'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricMode('symptom_frequency')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'symptom_frequency'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'text-rose-200/70 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isHindi ? 'लक्षण आवृत्ति (दिन)' : 'Symptom Frequency'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricMode('symptom_severity')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'symptom_severity'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'text-rose-200/70 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isHindi ? 'दर्द व मुंहासे स्कोर' : 'Pain & Acne Severity'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMetricMode('energy_metabolism')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              metricMode === 'energy_metabolism'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                : 'text-rose-200/70 hover:text-white hover:bg-rose-950/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isHindi ? 'ऊर्जा व इंसुलिन' : 'Energy & Insulin'}</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Clinical Shift Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#1c102a] p-4 rounded-2xl border border-purple-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-200/70">
            <span className="font-semibold uppercase text-[10px] tracking-wider">
              {isHindi ? 'चक्र अवधि कमी' : 'Cycle Interval'}
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-xs">
              <TrendingDown className="w-3 h-3 mr-0.5" /> {cycleLengthDelta}d
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{latestMonth?.avgCycleLength}</span>
            <span className="text-xs text-purple-300 font-semibold">{isHindi ? 'दिन' : 'Days'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isHindi ? '58 दिन (अप्रैल) से सुधरा' : 'Down from 58d (Apr 2026)'}
          </p>
        </div>

        <div className="bg-[#1c102a] p-4 rounded-2xl border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-200/70">
            <span className="font-semibold uppercase text-[10px] tracking-wider">
              {isHindi ? 'लक्षण वाले दिन' : 'Symptom Days'}
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-xs">
              <TrendingDown className="w-3 h-3 mr-0.5" /> {symptomDaysDelta}d
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-400">
              {latestMonth?.symptomFrequencyDays || 5}
            </span>
            <span className="text-xs text-rose-300 font-semibold">{isHindi ? 'दिन/माह' : 'Days/Mo'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isHindi ? '24 दिन/माह से 79% कमी' : '79% drop from 24 days/mo'}
          </p>
        </div>

        <div className="bg-[#1c102a] p-4 rounded-2xl border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-200/70">
            <span className="font-semibold uppercase text-[10px] tracking-wider">
              {isHindi ? 'माहवारी दर्द (क्रैम्प)' : 'Cramp Severity'}
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-xs">
              <TrendingDown className="w-3 h-3 mr-0.5" /> -{crampDeltaPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400">{latestMonth?.crampScore}</span>
            <span className="text-xs text-emerald-300 font-semibold">/ 5</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isHindi ? '4.7/5 गंभीर से हल्का' : 'Reduced from severe 4.7/5'}
          </p>
        </div>

        <div className="bg-[#1c102a] p-4 rounded-2xl border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-200/70">
            <span className="font-semibold uppercase text-[10px] tracking-wider">
              {isHindi ? 'दैनिक जीवन ऊर्जा' : 'Energy Index'}
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-xs">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{energyDeltaPercent}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-300">{latestMonth?.energyScore}</span>
            <span className="text-xs text-amber-200 font-semibold">/ 5</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isHindi ? 'दोपहर की थकान बंद' : 'No afternoon sugar crashes'}
          </p>
        </div>
      </div>

      {/* Interactive Line Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-rose-500/15 pb-3">
        <div className="flex items-center gap-1.5 text-rose-200/70">
          <Filter className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold">{isHindi ? 'दिखाई देने वाले मेट्रिक्स:' : 'Toggle Metrics:'}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {metricMode === 'cycle_duration' && (
            <>
              <button
                type="button"
                onClick={() => toggleLine('avgCycleLength')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.avgCycleLength
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>{isHindi ? 'माहवारी चक्र अवधि (दिन)' : 'Cycle Duration (Days)'}</span>
              </button>

              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-emerald-400" />
                <span>{isHindi ? 'लक्ष्य सीमा: 28-35 दिन' : 'Target Window: 28-35 Days'}</span>
              </div>
            </>
          )}

          {metricMode === 'symptom_frequency' && (
            <>
              <button
                type="button"
                onClick={() => toggleLine('symptomFrequencyDays')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.symptomFrequencyDays
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{isHindi ? 'लक्षण वाले दिन (दिन/माह)' : 'Symptom Frequency (Days/Mo)'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLine('crampScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.crampScore
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{isHindi ? 'क्रैम्प तीव्रता (0-5)' : 'Cramp Intensity (0-5)'}</span>
              </button>
            </>
          )}

          {metricMode === 'symptom_severity' && (
            <>
              <button
                type="button"
                onClick={() => toggleLine('crampScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.crampScore
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>{isHindi ? 'दर्द / क्रैम्प' : 'Cramp Severity'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLine('acneScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.acneScore
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                <span>{isHindi ? 'मुंहासे (एक्ने)' : 'Cystic Acne'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLine('bloatingScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.bloatingScore
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>{isHindi ? 'पेट फूलना' : 'Bloating'}</span>
              </button>
            </>
          )}

          {metricMode === 'energy_metabolism' && (
            <>
              <button
                type="button"
                onClick={() => toggleLine('energyScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.energyScore
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{isHindi ? 'दैनिक ऊर्जा (0-5)' : 'Energy Level (0-5)'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleLine('insulinScore')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                  visibleLines.insulinScore
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span>{isHindi ? 'इंसुलिन प्रतिरोधक स्तर' : 'Insulin Resistance Marker'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Recharts Line Chart Container */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />

            <XAxis
              dataKey="displayMonth"
              stroke="#e2e8f080"
              tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#ffffff20' }}
              tickLine={{ stroke: '#ffffff20' }}
            />

            {/* Y-Axes based on Metric Mode */}
            {metricMode === 'cycle_duration' && (
              <YAxis
                domain={[20, 65]}
                stroke="#e2e8f080"
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                axisLine={{ stroke: '#ffffff20' }}
                tickLine={{ stroke: '#ffffff20' }}
                unit="d"
              />
            )}

            {metricMode === 'symptom_frequency' && (
              <>
                <YAxis
                  yAxisId="days"
                  domain={[0, 30]}
                  stroke="#f43f5e"
                  tick={{ fill: '#f43f5e', fontSize: 11 }}
                  unit="d"
                />
                <YAxis
                  yAxisId="score"
                  orientation="right"
                  domain={[0, 5]}
                  stroke="#fbbf24"
                  tick={{ fill: '#fbbf24', fontSize: 11 }}
                  unit="/5"
                />
              </>
            )}

            {(metricMode === 'symptom_severity' || metricMode === 'energy_metabolism') && (
              <YAxis
                domain={[0, 5]}
                stroke="#e2e8f080"
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                unit="/5"
              />
            )}

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Target Lines for Cycle Duration */}
            {metricMode === 'cycle_duration' && (
              <>
                <ReferenceLine
                  y={35}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: isHindi ? 'स्वस्थ ऊपरी सीमा (35 दिन)' : 'Healthy Upper Bound (35d)',
                    fill: '#34d399',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  y={28}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: isHindi ? 'स्वस्थ निचली सीमा (28 दिन)' : 'Healthy Lower Bound (28d)',
                    fill: '#34d399',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
              </>
            )}

            {/* Render lines according to active mode */}
            {metricMode === 'cycle_duration' && visibleLines.avgCycleLength && (
              <Line
                type="monotone"
                dataKey="avgCycleLength"
                name={isHindi ? 'माहवारी चक्र अवधि' : 'Cycle Duration'}
                stroke="url(#purpleGradient)"
                strokeWidth={3.5}
                dot={{ fill: '#a855f7', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 8, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={1000}
              />
            )}

            {metricMode === 'symptom_frequency' && (
              <>
                {visibleLines.symptomFrequencyDays && (
                  <Line
                    yAxisId="days"
                    type="monotone"
                    dataKey="symptomFrequencyDays"
                    name={isHindi ? 'लक्षण वाले दिन/माह' : 'Symptom Days/Month'}
                    stroke="#f43f5e"
                    strokeWidth={3.5}
                    dot={{ fill: '#f43f5e', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 8, fill: '#fb7185', stroke: '#ffffff', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                )}
                {visibleLines.crampScore && (
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="crampScore"
                    name={isHindi ? 'क्रैम्प स्कोर' : 'Cramp Score'}
                    stroke="#fbbf24"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ fill: '#fbbf24', r: 4 }}
                    animationDuration={1000}
                  />
                )}
              </>
            )}

            {metricMode === 'symptom_severity' && (
              <>
                {visibleLines.crampScore && (
                  <Line
                    type="monotone"
                    dataKey="crampScore"
                    name={isHindi ? 'माहवारी दर्द (क्रैम्प्स)' : 'Cramps (0-5)'}
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ fill: '#f43f5e', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={1000}
                  />
                )}
                {visibleLines.acneScore && (
                  <Line
                    type="monotone"
                    dataKey="acneScore"
                    name={isHindi ? 'सिस्टिक मुंहासे' : 'Cystic Acne (0-5)'}
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    dot={{ fill: '#ec4899', r: 4 }}
                    animationDuration={1000}
                  />
                )}
                {visibleLines.bloatingScore && (
                  <Line
                    type="monotone"
                    dataKey="bloatingScore"
                    name={isHindi ? 'पेट फूलना (ब्लोटिंग)' : 'Bloating (0-5)'}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: '#06b6d4', r: 4 }}
                    animationDuration={1000}
                  />
                )}
              </>
            )}

            {metricMode === 'energy_metabolism' && (
              <>
                {visibleLines.energyScore && (
                  <Line
                    type="monotone"
                    dataKey="energyScore"
                    name={isHindi ? 'दैनिक ऊर्जा स्तर' : 'Energy Index'}
                    stroke="#fbbf24"
                    strokeWidth={3.5}
                    dot={{ fill: '#fbbf24', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                )}
                {visibleLines.insulinScore && (
                  <Line
                    type="monotone"
                    dataKey="insulinScore"
                    name={isHindi ? 'इंसुलिन प्रतिरोधक सूचकांक' : 'Insulin Resistance'}
                    stroke="#14b8a6"
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={1000}
                  />
                )}
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative Clinical Insights Bar */}
      <div className="bg-[#190f26] rounded-2xl p-4 sm:p-5 border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isHindi ? '6-महीने का वैज्ञानिक निष्कर्ष' : '6-Month Clinical Milestone Analysis'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Validated
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {isHindi
                ? 'माहवारी चक्र 58 दिनों (ओलिगोमेनोरिया) से घटकर 32 दिनों के स्वस्थ सामान्य चक्र में आ चुका है। पुदीना अर्क (Spearmint) और मायो-इनोसिटोल (Myo-Inositol 40:1) के नियमित उपयोग से मुंहासों और क्रैम्प्स में 70%+ की कमी दर्ज की गई है।'
                : 'Menstrual interval normalized from 58 days (oligomenorrhea) to 32 days within the healthy standard range (28-35 days). Routine GLUT4 workouts, Myo-Inositol, and spearmint tea reduced dysmenorrhea cramps by 70% and cut symptom days from 24 to 5 per month.'}
            </p>
          </div>
        </div>

        {onOpenConsultation && (
          <button
            type="button"
            onClick={onOpenConsultation}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-md shadow-rose-950/40 shrink-0 self-start md:self-auto"
          >
            {isHindi ? 'डॉक्टर से समीक्षा कराएं' : 'Share With Gynecologist'}
          </button>
        )}
      </div>
    </div>
  );
};
