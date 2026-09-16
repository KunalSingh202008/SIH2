import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Layers,
  Cpu,
  Radio,
  Clock,
  ShieldCheck,
  ChevronRight,
  FileCheck,
  AlertCircle,
  Eye,
  Languages,
  Subtitles,
  Smartphone,
  Flame,
  ArrowRight,
  PictureInPicture,
  Mic,
  Check,
} from 'lucide-react';
import { LanguageCode } from '../types';

interface SmartKitVideoShowcaseProps {
  currentLanguage: LanguageCode;
  onLaunchSimulator?: () => void;
  onOpenVoiceSaathi?: () => void;
}

interface VideoChapter {
  id: string;
  time: number;
  endTime: number;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  correctedOverlayEn: string;
  correctedOverlayHi: string;
  originalGlitchText: string;
  telemetrySnapshot: {
    state: string;
    sensor: string;
    reading: string;
    voiceCaption: string;
  };
}

export const SmartKitVideoShowcase: React.FC<SmartKitVideoShowcaseProps> = ({
  currentLanguage,
  onLaunchSimulator,
  onOpenVoiceSaathi,
}) => {
  const isHindi = currentLanguage === 'hi';
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15.1);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [cleanOverlayActive, setCleanOverlayActive] = useState(true);
  const [selectedLanguageTrack, setSelectedLanguageTrack] = useState<'en' | 'hi'>(isHindi ? 'hi' : 'en');
  const [activeTab, setActiveTab] = useState<'video' | 'corrections' | 'telemetry'>('video');
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);

  const chapters: VideoChapter[] = [
    {
      id: 'ch-1',
      time: 0,
      endTime: 3.5,
      titleEn: '1. Handheld Smart Kit & App Companion Setup',
      titleHi: '१. हैंडहेल्ड स्मार्ट किट व ऐप कम्पैनियन सेटअप',
      descEn: 'User comfortably seated with the portable StreeSure IoT device and synced mobile app on table.',
      descHi: 'उपयोगकर्ता पोर्टेबल स्त्रीश्योर डिवाइस और सिंक किए गए मोबाइल ऐप के साथ तैयार।',
      correctedOverlayEn: 'STREESURE: AI-Assisted Women\'s Health Screening & Care Ecosystem',
      correctedOverlayHi: 'स्त्रीश्योर: एआई-संचालित महिला स्वास्थ्य स्क्रीनिंग व संपूर्ण देखभाल',
      originalGlitchText: 'STREESURE\nAI-cassssed womn\'s healt srienig & care eccoonrtncy',
      telemetrySnapshot: {
        state: 'READY / STANDBY',
        sensor: 'Dual 525nm/850nm Photodiodes',
        reading: 'Battery 94% · BLE 5.3 Active',
        voiceCaption: '"कृपया स्त्रीश्योर किट को समतल सतह पर रखें।"',
      },
    },
    {
      id: 'ch-2',
      time: 3.5,
      endTime: 7.0,
      titleEn: '2. Capillary Sample Touch & Detection',
      titleHi: '२. कैपिलरी सैंपल टच व डिटेक्शन',
      descEn: 'Gentle micro-volume capillary touch detected by optical colorimetric chamber (TCS34725).',
      descHi: 'ऑप्टिकल बायो-सेंसर द्वारा सूक्ष्म कैपिलरी सैंपल का त्वरित परीक्षण।',
      correctedOverlayEn: 'CAPILLARY BIOSENSOR ACTIVE · Optical 525nm Chamber Calibrated',
      correctedOverlayHi: 'कैपिलरी बायो-सेंसर सक्रिय · ऑप्टिकल 525nm चैंबर कैलिब्रेटेड',
      originalGlitchText: 'SAMPLE / SAMPLE DETECTED (Device screen flicker & scramble)',
      telemetrySnapshot: {
        state: 'SAMPLE_DETECTED',
        sensor: 'TCS34725 Optical Colorimeter',
        reading: 'Absorbance 525nm: 0.428 AU · Zero Delay',
        voiceCaption: '"सैंपल प्राप्त हुआ। ऑप्टिकल विश्लेषण चल रहा है।"',
      },
    },
    {
      id: 'ch-3',
      time: 7.0,
      endTime: 10.5,
      titleEn: '3. Encrypted BLE Sync & Voice Saathi (Sakhi)',
      titleHi: '३. एन्क्रिप्टेड बीएलई सिंक व वॉयस साथी (सखी)',
      descEn: 'Hardware securely streams biomarker telemetry to phone; AI Voice Avatar Sakhi confirms result.',
      descHi: 'हार्डवेयर सुरक्षित ब्लूटूथ से फोन में डेटा भेजता है; वॉयस साथी सखी ऑडियो से मार्गदर्शन देती है।',
      correctedOverlayEn: 'BLE 5.3 ENCRYPTED SYNC · StreeSure Companion App Connected · Voice Saathi Active',
      correctedOverlayHi: 'बीएलई 5.3 एन्क्रिप्टेड सिंक · स्त्रीश्योर मोबाइल ऐप कनेक्टेड · वॉयस साथी सक्रिय',
      originalGlitchText: 'MEASUREMENT IN PROGRESS Glucose 112... / Aapke screening profile me...',
      telemetrySnapshot: {
        state: 'BLE_SYNC_SUCCESS',
        sensor: 'ESP32-S3 BLE 5.3 AES-GCM',
        reading: 'Glucose: 112 mg/dL · PPG: 76 bpm · Sync: 100%',
        voiceCaption: '"आपके स्क्रीनिंग प्रोफ़ाइल में डेटा सिंक हो गया है। सब सामान्य है।"',
      },
    },
    {
      id: 'ch-4',
      time: 10.5,
      endTime: 15.1,
      titleEn: '4. Empowered Patient Experience & Vision',
      titleHi: '४. सशक्त महिला स्वास्थ्य अनुभव व विज़न',
      descEn: 'Patient relieved and empowered with non-invasive clarity, community access, and dignity.',
      descHi: 'सटीक, सुलभ और गरिमापूर्ण स्वास्थ्य देखभाल से आत्मविश्वास और मानसिक शांति।',
      correctedOverlayEn: 'Women\'s health... understood differently, addressed differently.',
      correctedOverlayHi: 'महिलाओं का स्वास्थ्य... एक नई समझ, एक नई शुरुआत।',
      originalGlitchText: 'Women\'s health, , , undernteed differeny uddersaed differenry',
      telemetrySnapshot: {
        state: 'COMPLETED / SECURE',
        sensor: 'Local Vault Encrypted',
        reading: 'Risk Level: Low / Normalizing · ABDM Ready',
        voiceCaption: '"स्त्रीश्योर आपके स्वास्थ्य सफर में हर कदम पर साथ है।"',
      },
    },
  ];

  // Sync current chapter index with playback time
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const activeIdx = chapters.findIndex(
      (c) => time >= c.time && time < c.endTime
    );
    if (activeIdx !== -1 && activeIdx !== activeChapterIndex) {
      setActiveChapterIndex(activeIdx);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 15.1);
    }
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const jumpToChapter = (chapterTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = chapterTime;
      setCurrentTime(chapterTime);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // Ignore PiP errors
    }
  };

  // Keyboard shortcut navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'ArrowRight' && videoRef.current) {
        videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 3, duration);
      } else if (e.key === 'ArrowLeft' && videoRef.current) {
        videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 3, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, duration]);

  // Voice Saathi audio readout of the current caption
  const speakCurrentCaption = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const caption = currentChapter.telemetrySnapshot.voiceCaption.replace(/"/g, '');
    const utter = new SpeechSynthesisUtterance(caption);
    utter.lang = 'hi-IN';
    utter.rate = 0.95;
    setIsSpeakingVoice(true);
    utter.onend = () => setIsSpeakingVoice(false);
    utter.onerror = () => setIsSpeakingVoice(false);
    window.speechSynthesis.speak(utter);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  return (
    <div className="bg-[#12081d] rounded-3xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl space-y-8">
      {/* Header with Efficiency & Quality Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-rose-500/20 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>{isHindi ? 'स्मार्ट किट लाइव वीडियो प्रदर्शन' : 'Smart Kit Live Demonstration & Video'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isHindi ? 'स्त्रीश्योर सेंस — हार्डवेयर व ऐप इंटीग्रेशन वीडियो' : 'StreeSure Sense — Hardware & App Walkthrough'}
          </h2>
          <p className="text-xs sm:text-sm text-rose-200/80 max-w-2xl leading-relaxed">
            {isHindi
              ? 'पोर्टेबल ऑप्टिकल बायोसेंसर, मोबाइल ऐप पेयरिंग और वॉयस साथी सखी ऑडियो मार्गदर्शन का उच्च-दक्षता 720p 60fps वीडियो प्रदर्शन।'
              : 'Optimized 720p faststart MP4 demonstration showcasing capillary sample detection, BLE 5.3 mobile sync, Voice Saathi (Sakhi) guidance, and corrected clinical typography.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-switch-tab-video"
            onClick={() => setActiveTab('video')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'bg-white/5 text-rose-200 hover:bg-white/10 border border-rose-500/20'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isHindi ? 'वीडियो प्लेयर' : 'HD Video Player'}</span>
          </button>

          <button
            type="button"
            id="btn-switch-tab-corrections"
            onClick={() => setActiveTab('corrections')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'corrections'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                : 'bg-white/5 text-rose-200 hover:bg-white/10 border border-rose-500/20'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>{isHindi ? 'टेक्स्ट सुधार तुलना' : 'Corrected Text Audit'}</span>
          </button>

          <button
            type="button"
            id="btn-switch-tab-telemetry"
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-white/5 text-rose-200 hover:bg-white/10 border border-rose-500/20'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isHindi ? 'सेंसर टेलीमेट्री' : 'Sensor Telemetry'}</span>
          </button>

          {onLaunchSimulator && (
            <button
              type="button"
              id="btn-launch-hardware-simulator"
              onClick={onLaunchSimulator}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1.5 ml-1"
            >
              <span>{isHindi ? 'सिम्युलेटर लॉन्च करें' : 'Launch Kit Simulator'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video & Interactive Stage */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          {/* Top Video Utility Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-3 rounded-2xl border border-rose-500/20 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isHindi ? 'दक्षता अनुकूलन: 720p H.264 FastStart' : 'Efficiency: 720p H.264 FastStart Instant Buffer'}
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-300 font-mono text-[11px]">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Clean Typographic Mask Toggle */}
              <button
                type="button"
                onClick={() => setCleanOverlayActive(!cleanOverlayActive)}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs ${
                  cleanOverlayActive
                    ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-950/40 border border-emerald-400/50'
                    : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'
                }`}
                title="Mask AI-generated distorted video text with clean clinical typography"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isHindi ? 'सटीक टेक्स्ट मास्क' : 'Clean Text Overlay'}</span>
              </button>

              {/* Voice Saathi Audio Playback */}
              <button
                type="button"
                onClick={speakCurrentCaption}
                disabled={isSpeakingVoice}
                className="px-3 py-1.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 text-pink-200 border border-pink-400/30 font-bold transition flex items-center gap-1.5 text-xs disabled:opacity-50"
                title="Hear Sakhi Voice Guidance for this scene"
              >
                <Mic className={`w-3.5 h-3.5 ${isSpeakingVoice ? 'animate-pulse text-pink-300' : ''}`} />
                <span>{isSpeakingVoice ? (isHindi ? 'बोल रहे हैं...' : 'Speaking...') : (isHindi ? 'सखी आवाज़ सुनें' : 'Play Voice Saathi')}</span>
              </button>
            </div>
          </div>
          {/* Video Container */}
          <div
            ref={containerRef}
            className="relative rounded-3xl overflow-hidden bg-black border-2 border-rose-500/30 shadow-2xl group aspect-video max-h-[560px] w-full mx-auto"
          >
            <video
              ref={videoRef}
              src="/assets/videos/streesure_smart_kit_demo.mp4"
              poster="/assets/images/smart_kit_hero.jpg"
              preload="auto"
              playsInline
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-cover cursor-pointer"
              onClick={togglePlay}
            />

            {/* Video Overlay Watermark / Brand Header */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-rose-500/40 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>STREESURE SENSE</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-[10px] font-mono text-emerald-300 font-bold">
                BLE 5.3 SYNCED
              </span>
            </div>

            {/* Dynamic Clean Typographic Mask: Covers distorted AI text in real-time */}
            {cleanOverlayActive && (
              <div className="absolute top-14 inset-x-4 sm:inset-x-12 z-20 pointer-events-none flex justify-center text-center animate-in fade-in duration-300">
                <div className="max-w-xl w-full px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-rose-500/40 text-white shadow-2xl space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                      Corrected Clinical Text · Frame {activeChapterIndex + 1}/4
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold tracking-wide text-white">
                    {selectedLanguageTrack === 'hi'
                      ? currentChapter.correctedOverlayHi
                      : currentChapter.correctedOverlayEn}
                  </p>
                </div>
              </div>
            )}

            {/* Big Center Play Button when paused */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer transition"
              >
                <div className="w-20 h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-900/60 transform hover:scale-110 transition border border-white/20">
                  <Play className="w-8 h-8 ml-1" />
                </div>
              </div>
            )}

            {/* Subtitles Overlay Bar */}
            {showSubtitles && (
              <div className="absolute bottom-16 inset-x-4 z-20 pointer-events-none flex justify-center text-center">
                <div className="max-w-2xl px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-xl">
                  <p className="text-xs sm:text-sm font-semibold tracking-wide text-rose-100">
                    {selectedLanguageTrack === 'hi'
                      ? currentChapter.correctedOverlayHi
                      : currentChapter.correctedOverlayEn}
                  </p>
                  <p className="text-[10px] text-pink-300/80 italic mt-0.5">
                    {currentChapter.telemetrySnapshot.voiceCaption}
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-0 inset-x-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2">
              {/* Timeline Scrubber */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-rose-200/80 shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 15.1}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-pink-400"
                />
                <span className="text-[11px] font-mono text-rose-200/80 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Lower Controls Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Replay */}
                  <button
                    type="button"
                    onClick={() => jumpToChapter(0)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Volume/Mute */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>

                  {/* Current Chapter Tag */}
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30 text-[11px] font-bold text-rose-200 truncate max-w-xs">
                    {isHindi ? currentChapter.titleHi : currentChapter.titleEn}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Subtitles Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className={`p-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 ${
                      showSubtitles ? 'bg-rose-600 text-white' : 'bg-white/10 text-white/70'
                    }`}
                    title="Toggle Subtitles"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    <span className="text-[10px]">CC</span>
                  </button>

                  {/* Subtitles Language Switcher */}
                  <button
                    type="button"
                    onClick={() => setSelectedLanguageTrack(selectedLanguageTrack === 'en' ? 'hi' : 'en')}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition uppercase"
                    title="Switch Subtitle Language"
                  >
                    {selectedLanguageTrack === 'en' ? 'EN' : 'हिन्दी'}
                  </button>

                  {/* Playback Speed Pill */}
                  <div className="flex items-center gap-0.5 bg-black/40 rounded-lg p-0.5 border border-white/10">
                    {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => handleSpeedChange(speed)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                          playbackRate === speed
                            ? 'bg-rose-500 text-white'
                            : 'text-rose-200/60 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Picture-in-Picture */}
                  <button
                    type="button"
                    onClick={togglePictureInPicture}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition hidden sm:block"
                    title="Picture in Picture"
                  >
                    <PictureInPicture className="w-4 h-4" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                    title="Toggle Fullscreen (F)"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chapter Timeline Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>{isHindi ? 'समयरेखा व अध्याय चयन' : 'Jump to Demonstration Scene & Telemetry'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isHindi ? 'शॉर्टकट: स्पेस (प्ले), M (म्यूट), F (फुलस्क्रीन)' : 'Shortcuts: Space (Play), M (Mute), F (Fullscreen), ← / → (Seek)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {chapters.map((ch, idx) => {
                const isSelected = activeChapterIndex === idx;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(ch.time)}
                    className={`text-left p-4 rounded-2xl border transition space-y-1.5 relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-rose-950/70 to-purple-950/70 border-rose-500 shadow-lg shadow-rose-950/50 text-white'
                        : 'bg-[#180e25] border-rose-500/15 hover:border-rose-500/40 text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-0 right-0 w-2 h-full bg-rose-500" />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                        {formatTime(ch.time)} – {formatTime(ch.endTime)}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white line-clamp-1">
                      {isHindi ? ch.titleHi : ch.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {isHindi ? ch.descHi : ch.descEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CORRECTED TEXT AUDIT & COMPARISON (Full 4-Scene Clinical Report) */}
      {activeTab === 'corrections' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 leading-relaxed">
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">
                  {isHindi ? 'वीडियो में प्रयुक्त टेक्स्ट का 4-चरणीय पूर्ण सुधार' : 'Video Typography & AI Hallucination Cleanup Report (4 Scenes)'}
                </p>
                <p>
                  {isHindi
                    ? 'मूल वीडियो में एआई जनित त्रुटिपूर्ण और विकृत वर्तनी थी। इसे क्लिनिकल सटीकता और पेशेवर प्रस्तुति हेतु शुद्ध अंग्रेजी व प्रामाणिक हिंदी में संशोधित किया गया है।'
                    : 'The raw AI video contained distorted, misspelled text overlays. We have corrected every frame to ensure professional medical accuracy, jury compliance, and bilingual clarity.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scene 1: Opening Frame */}
            <div className="bg-[#180e25] rounded-3xl p-6 border border-rose-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/15 pb-3">
                <span className="text-xs font-bold uppercase text-rose-300">Scene 1 · Setup & Opening</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 font-bold">
                  00:00 – 00:03.5
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Original AI Video Text (Distorted):</span>
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-rose-900/60 font-mono text-xs text-rose-300/80 line-through">
                  "STREESURE<br />AI-cassssed womn's healt srienig & care eccoonrtncy"
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Corrected & Standardized Text:</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-white space-y-1">
                  <p className="font-bold text-emerald-300">STREESURE</p>
                  <p className="font-semibold text-rose-100">
                    AI-Assisted Women's Health Screening & Care Ecosystem
                  </p>
                  <p className="text-[11px] text-pink-300 pt-1">
                    (हिंदी: स्त्रीश्योर — एआई-संचालित महिला स्वास्थ्य स्क्रीनिंग व संपूर्ण देखभाल)
                  </p>
                </div>
              </div>
            </div>

            {/* Scene 2: Biosensor Touch Detection */}
            <div className="bg-[#180e25] rounded-3xl p-6 border border-rose-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/15 pb-3">
                <span className="text-xs font-bold uppercase text-rose-300">Scene 2 · Capillary Sensor Touch</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 font-bold">
                  00:03.5 – 00:07.0
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Original AI Video Text (Distorted):</span>
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-rose-900/60 font-mono text-xs text-rose-300/80 line-through">
                  "SAMPLE / SAMPLE DETECTED<br />(Device screen flickers with garbled characters)"
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Corrected & Standardized Text:</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-white space-y-1">
                  <p className="font-bold text-emerald-300">CAPILLARY BIOSENSOR ACTIVE</p>
                  <p className="font-semibold text-rose-100">
                    Optical 525nm Chamber Calibrated · Instant Detection
                  </p>
                  <p className="text-[11px] text-pink-300 pt-1">
                    (हिंदी: कैपिलरी बायो-सेंसर सक्रिय · ऑप्टिकल 525nm चैंबर कैलिब्रेटेड)
                  </p>
                </div>
              </div>
            </div>

            {/* Scene 3: BLE Sync & Voice Saathi */}
            <div className="bg-[#180e25] rounded-3xl p-6 border border-rose-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/15 pb-3">
                <span className="text-xs font-bold uppercase text-rose-300">Scene 3 · BLE Sync & Sakhi Avatar</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 font-bold">
                  00:07.0 – 00:10.5
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Original AI Video Text (Distorted):</span>
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-rose-900/60 font-mono text-xs text-rose-300/80 line-through">
                  "MEASUREMENT IN PROGRESS Glucose 112...<br />Aapke screening profile me..."
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Corrected & Standardized Text:</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-white space-y-1">
                  <p className="font-bold text-emerald-300">BLE 5.3 ENCRYPTED SYNC</p>
                  <p className="font-semibold text-rose-100">
                    Companion App Synced · Sakhi Audio Guidance Active
                  </p>
                  <p className="text-[11px] text-pink-300 pt-1">
                    (हिंदी: बीएलई 5.3 एन्क्रिप्टेड सिंक · मोबाइल ऐप कनेक्टेड · वॉयस साथी सक्रिय)
                  </p>
                </div>
              </div>
            </div>

            {/* Scene 4: Closing Brand Motto */}
            <div className="bg-[#180e25] rounded-3xl p-6 border border-rose-500/20 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/15 pb-3">
                <span className="text-xs font-bold uppercase text-rose-300">Scene 4 · Closing Brand Motto</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 font-bold">
                  00:10.5 – 00:15.1
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Original AI Video Text (Distorted):</span>
                </span>
                <div className="p-3 rounded-xl bg-black/60 border border-rose-900/60 font-mono text-xs text-rose-300/80 line-through">
                  "Women's health, , ,<br />
                  underneed differeny<br />
                  uddersaed differenry"
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Corrected & Standardized Text:</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-white space-y-1">
                  <p className="font-bold text-emerald-300">
                    "Women's health... understood differently, addressed differently."
                  </p>
                  <p className="text-[11px] text-pink-300 pt-1">
                    (हिंदी: "महिलाओं का स्वास्थ्य... एक नई समझ, एक नई शुरुआत।")
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HARDWARE TELEMETRY SPECIFICATIONS */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#180e25] rounded-2xl p-5 border border-rose-500/20 space-y-2">
              <span className="text-[11px] text-rose-300 uppercase font-semibold">Sensor Architecture</span>
              <p className="text-lg font-bold text-white">TCS34725 Optical</p>
              <p className="text-xs text-slate-400">Colorimetric micro-fluidic strip reading with 525nm LED illumination.</p>
            </div>

            <div className="bg-[#180e25] rounded-2xl p-5 border border-rose-500/20 space-y-2">
              <span className="text-[11px] text-rose-300 uppercase font-semibold">Telemetry Speed</span>
              <p className="text-lg font-bold text-emerald-400">&lt; 3.2 Seconds</p>
              <p className="text-xs text-slate-400">Zero-delay instant capillary detection and validation handshake.</p>
            </div>

            <div className="bg-[#180e25] rounded-2xl p-5 border border-rose-500/20 space-y-2">
              <span className="text-[11px] text-rose-300 uppercase font-semibold">Security Protocol</span>
              <p className="text-lg font-bold text-purple-300">BLE 5.3 AES-GCM</p>
              <p className="text-xs text-slate-400">Encrypted token exchange ensuring HIPAA/ABDM compliant data transmission.</p>
            </div>

            <div className="bg-[#180e25] rounded-2xl p-5 border border-rose-500/20 space-y-2">
              <span className="text-[11px] text-rose-300 uppercase font-semibold">Voice Companion</span>
              <p className="text-lg font-bold text-pink-300">Sakhi (Voice Saathi)</p>
              <p className="text-xs text-slate-400">Multilingual audio guidance for rural users and ASHA community workers.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
