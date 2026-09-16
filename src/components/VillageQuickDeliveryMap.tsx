import React, { useState, useEffect } from 'react';
import {
  Bike,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Package,
  Layers,
  Zap,
  Radio,
  Truck,
  Heart,
  Eye,
  RefreshCw,
  Send,
  Volume2,
  PhoneCall,
  X,
  Store,
  ChevronRight,
  AlertCircle,
  Search,
  Building2,
  LocateFixed,
  Compass,
} from 'lucide-react';
import { DeliveryPartner, VillageDarkStore, CartItem } from '../types';
import { SEED_DELIVERY_PARTNERS, SEED_VILLAGE_DARK_STORES } from '../data/seedData';
import { GoogleMapsVillageTracker } from './GoogleMapsVillageTracker';

interface VillageQuickDeliveryMapProps {
  orderId?: string;
  selectedPartner?: DeliveryPartner;
  orderedItems?: CartItem[];
  deliveryAddress?: {
    fullName: string;
    phone: string;
    villageOrStreet: string;
    district: string;
    pincode: string;
  };
  totalAmount?: number;
  onClose?: () => void;
}

export const VillageQuickDeliveryMap: React.FC<VillageQuickDeliveryMapProps> = ({
  orderId = 'STR-RUR-9021',
  selectedPartner = SEED_DELIVERY_PARTNERS[0],
  orderedItems = [],
  deliveryAddress = {
    fullName: 'Sunita Sharma',
    phone: '+91 98765 43210',
    villageOrStreet: 'Ward 4, Near Shiva Temple, Govindgarh',
    district: 'Jaipur Rural (Rajasthan)',
    pincode: '303702',
  },
  totalAmount = 298,
  onClose,
}) => {
  // Live simulated position progress: 0 (at dark store) to 100 (at doorstep)
  const [riderProgress, setRiderProgress] = useState(38);
  const [isCallingRider, setIsCallingRider] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'live_tracking' | 'village_access' | 'dark_stores' | 'discreet_notes'>('live_tracking');
  const [discreetNote, setDiscreetNote] = useState('Please pack in opaque brown paper bag and hand over directly.');
  const [noteSaved, setNoteSaved] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(18 * 60 - 45); // ~17 mins
  const [activeDarkStore, setActiveDarkStore] = useState<VillageDarkStore>(SEED_VILLAGE_DARK_STORES[0]);
  const [isEmergencyDroneActive, setIsEmergencyDroneActive] = useState(selectedPartner.partnerType === 'SOS_DRONE');

  // Village Access & Product Locator state
  const [villageSearchQuery, setVillageSearchQuery] = useState('');
  const [selectedVillageCoverage, setSelectedVillageCoverage] = useState<{
    villageName: string;
    block: string;
    pincode: string;
    status: 'ACTIVE_15MIN' | 'ASHA_DEPOT' | 'DRONE_CORRIDOR';
    nearestHub: string;
    distanceKm: number;
    deliveryTimeMinutes: number;
    inStockCount: { pads: number; tablets: number; patches: number; smartKits: number };
  }>({
    villageName: 'Govindgarh (Ward 1 - 12)',
    block: 'Chomu Block',
    pincode: '303702',
    status: 'ACTIVE_15MIN',
    nearestHub: 'StreeSure × Zepto Rural Micro-Hub #04',
    distanceKm: 2.3,
    deliveryTimeMinutes: 18,
    inStockCount: { pads: 1800, tablets: 340, patches: 450, smartKits: 40 },
  });

  const RURAL_VILLAGE_COVERAGE_ZONES = [
    {
      villageName: 'Govindgarh (Ward 1 - 12)',
      block: 'Chomu Block',
      pincode: '303702',
      status: 'ACTIVE_15MIN' as const,
      nearestHub: 'StreeSure × Zepto Rural Micro-Hub #04',
      distanceKm: 2.3,
      deliveryTimeMinutes: 18,
      inStockCount: { pads: 1800, tablets: 340, patches: 450, smartKits: 40 },
    },
    {
      villageName: 'Chomu Rural & Morija',
      block: 'Chomu Tehsil',
      pincode: '303702',
      status: 'ACTIVE_15MIN' as const,
      nearestHub: 'Govindgarh PHC Central Dispensary',
      distanceKm: 3.8,
      deliveryTimeMinutes: 20,
      inStockCount: { pads: 3200, tablets: 580, patches: 600, smartKits: 65 },
    },
    {
      villageName: 'Nangal Kalan & Hamlets',
      block: 'Nangal Kalan',
      pincode: '303701',
      status: 'ACTIVE_15MIN' as const,
      nearestHub: 'Blinkit Gramin Pharmacy Node #12',
      distanceKm: 4.5,
      deliveryTimeMinutes: 22,
      inStockCount: { pads: 1400, tablets: 210, patches: 320, smartKits: 25 },
    },
    {
      villageName: 'Kaladera Rural Industrial Zone',
      block: 'Kaladera',
      pincode: '303801',
      status: 'ASHA_DEPOT' as const,
      nearestHub: 'StreeSure × Zepto Rural Micro-Hub #04',
      distanceKm: 7.2,
      deliveryTimeMinutes: 25,
      inStockCount: { pads: 950, tablets: 180, patches: 240, smartKits: 15 },
    },
    {
      villageName: 'Shahpura Rural Sub-Centre',
      block: 'Shahpura',
      pincode: '303103',
      status: 'DRONE_CORRIDOR' as const,
      nearestHub: 'Shahpura PHC Station',
      distanceKm: 12.0,
      deliveryTimeMinutes: 12,
      inStockCount: { pads: 2200, tablets: 400, patches: 380, smartKits: 30 },
    },
    {
      villageName: 'Jamwa Ramgarh Valley',
      block: 'Jamwa Ramgarh',
      pincode: '303109',
      status: 'ASHA_DEPOT' as const,
      nearestHub: 'Jamwa PHC Depot',
      distanceKm: 14.5,
      deliveryTimeMinutes: 30,
      inStockCount: { pads: 800, tablets: 120, patches: 160, smartKits: 10 },
    },
  ];

  // Filtered villages
  const filteredVillages = RURAL_VILLAGE_COVERAGE_ZONES.filter(
    (v) =>
      v.villageName.toLowerCase().includes(villageSearchQuery.toLowerCase()) ||
      v.block.toLowerCase().includes(villageSearchQuery.toLowerCase()) ||
      v.pincode.includes(villageSearchQuery)
  );

  // Simulated live moving rider timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRiderProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + 0.5;
      });
      setRemainingSeconds((prev) => (prev > 60 ? prev - 1 : 60));
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Call duration counter
  useEffect(() => {
    let callTimer: NodeJS.Timeout;
    if (isCallingRider) {
      callTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(callTimer);
  }, [isCallingRider]);

  const minutesLeft = Math.floor(remainingSeconds / 60);
  const secondsLeft = remainingSeconds % 60;

  // Road coordinates simulation for SVG map
  // Route from Dark store (X: 60, Y: 220) through village roads to Home (X: 380, Y: 80)
  const routePoints = [
    { x: 60, y: 220, label: 'Govindgarh Zepto/Blinkit Dark Store' },
    { x: 120, y: 200, label: 'Govindgarh Sub-Centre PHC' },
    { x: 180, y: 230, label: 'Chomu Bypass Road' },
    { x: 240, y: 170, label: 'Gram Panchayat Circle' },
    { x: 310, y: 120, label: 'Ward 3 Canal Bridge' },
    { x: 380, y: 80, label: 'Sunita\'s Doorstep (Ward 4)' },
  ];

  // Calculate rider's current SVG coordinate based on riderProgress (0 to 100%)
  const riderPointIndex = Math.min(
    Math.floor((riderProgress / 100) * (routePoints.length - 1)),
    routePoints.length - 2
  );
  const localProg = ((riderProgress / 100) * (routePoints.length - 1)) - riderPointIndex;
  const p1 = routePoints[riderPointIndex];
  const p2 = routePoints[riderPointIndex + 1];
  const currentRiderX = p1.x + (p2.x - p1.x) * localProg;
  const currentRiderY = p1.y + (p2.y - p1.y) * localProg;

  const currentRoadName =
    riderProgress < 20
      ? 'Leaving Micro Dark-Store Hub'
      : riderProgress < 45
      ? 'Chomu-Govindgarh Link Road (Speed: 28 km/h)'
      : riderProgress < 75
      ? 'Near Ward 3 Shiva Temple & Primary School'
      : riderProgress < 95
      ? 'Entering Ward 4 Residential Lane'
      : 'Arrived at Doorstep!';

  return (
    <div className="w-full bg-[#110B18] border border-rose-500/20 rounded-3xl overflow-hidden shadow-2xl text-slate-100 animate-in fade-in duration-300">
      {/* Top Banner: Blinkit / Zepto Village Express Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/80 via-purple-950/60 to-slate-900 border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-900/50">
            {selectedPartner.partnerType === 'SOS_DRONE' ? (
              <Zap className="w-6 h-6 animate-pulse" />
            ) : selectedPartner.partnerType === 'ASHA_EXPRESS' ? (
              <Heart className="w-6 h-6 text-rose-100" />
            ) : (
              <Bike className="w-6 h-6 animate-bounce duration-1000" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-pink-300 border border-rose-500/30">
                {selectedPartner.logoBadge}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-ping" />
                Live GPS Active
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Village Quick-Commerce Delivery</span>
              <span className="text-xs font-mono text-rose-300 font-normal">#{orderId}</span>
            </h2>
          </div>
        </div>

        {/* ETA Highlight Badge */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-rose-950/80 border border-pink-500/40 text-right shadow-inner">
            <span className="block text-[10px] uppercase font-bold text-rose-300 tracking-wider">
              Estimated Delivery
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-white flex items-center justify-end gap-1.5">
              <Clock className="w-4 h-4 text-pink-400 animate-spin duration-3000" />
              <span>
                {minutesLeft}:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
              </span>
              <span className="text-xs font-normal text-rose-200">mins</span>
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-rose-300 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition"
              title="Close Map Tracking"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation: Live Tracking / Village Access / Dark Store Network / Discreet Delivery Notes */}
      <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-rose-500/15 flex gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('live_tracking')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'live_tracking'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Google Maps Live Route</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('village_access')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'village_access'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Village Access & Products Locator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dark_stores')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'dark_stores'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Village Dark-Stores & Inventory ({SEED_VILLAGE_DARK_STORES.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('discreet_notes')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'discreet_notes'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-500/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Discreet Hand-Off Notes</span>
          {noteSaved && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
        </button>
      </div>

      {/* TAB 1: LIVE INTERACTIVE GOOGLE MAP & TRACKING */}
      {activeTab === 'live_tracking' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Google Maps Village Corridor Delivery Tracker */}
          <GoogleMapsVillageTracker
            riderProgress={riderProgress}
            selectedPartner={selectedPartner}
            activeDarkStore={activeDarkStore}
            darkStores={SEED_VILLAGE_DARK_STORES}
            destinationAddress={deliveryAddress}
            onSelectDarkStore={(store) => setActiveDarkStore(store)}
          />

          {/* Delivery Timeline / Status Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-rose-200">
              <span>Village Micro-Hub Order Timeline</span>
              <span className="text-emerald-400 font-bold">{Math.round(riderProgress)}% Completed</span>
            </div>

            <div className="w-full bg-rose-950/60 rounded-full h-2.5 p-0.5 border border-rose-500/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 transition-all duration-700 shadow-lg shadow-rose-900/50"
                style={{ width: `${riderProgress}%` }}
              ></div>
            </div>

            {/* 4 Step Milestones */}
            <div className="grid grid-cols-4 gap-1 pt-1 text-center text-[10px] text-rose-300/80 font-medium">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span className="text-white font-bold">1. Placed</span>
                <span className="text-[9px] text-rose-400">Govt Subsidized</span>
              </div>

              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span className="text-white font-bold">2. Packed</span>
                <span className="text-[9px] text-rose-400">Sterile Pouch</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[9px] font-bold mb-0.5 animate-pulse">
                  3
                </div>
                <span className="text-pink-300 font-bold">3. In Transit</span>
                <span className="text-[9px] text-rose-400">Hero E-Bike</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-rose-950 border border-rose-500/40 text-rose-400 flex items-center justify-center text-[9px] mb-0.5">
                  4
                </div>
                <span className="text-slate-400">4. Doorstep</span>
                <span className="text-[9px] text-slate-500">Ward 4 House</span>
              </div>
            </div>
          </div>

          {/* Delivery Partner Profile Card & Contact Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-purple-950/30 to-slate-950 border border-rose-500/30 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Rider Identity */}
            <div className="flex items-center gap-3.5 md:col-span-2">
              <img
                src={selectedPartner.riderPhoto}
                alt={selectedPartner.riderName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-pink-500/50 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    {selectedPartner.riderName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Partner
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 font-medium">
                  {selectedPartner.vehicleType} • <span className="font-mono text-pink-300">{selectedPartner.vehicleNumber}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-rose-300/70 pt-0.5">
                  <span className="text-amber-300 font-bold flex items-center gap-0.5">
                    ★ {selectedPartner.rating}
                  </span>
                  <span>•</span>
                  <span>{selectedPartner.totalDeliveries}+ Safe Rural Deliveries</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Calling Buttons */}
            <div className="flex flex-row md:flex-col gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsCallingRider(true)}
                className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 hover:scale-102 transition"
              >
                <Phone className="w-4 h-4" />
                <span>Call Delivery Partner</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('discreet_notes')}
                className="flex-1 md:flex-none py-2.5 px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900/60 text-rose-200 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <ShieldCheck className="w-4 h-4 text-pink-400" />
                <span>Discreet Instructions</span>
              </button>
            </div>
          </div>

          {/* Delivery Address & Order Safeguards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-1">
              <span className="text-[10px] font-mono text-rose-300 uppercase tracking-wider block">
                Destination Address:
              </span>
              <strong className="text-white block">{deliveryAddress.fullName} ({deliveryAddress.phone})</strong>
              <p className="text-rose-200/80 leading-snug">
                {deliveryAddress.villageOrStreet}, {deliveryAddress.district} - {deliveryAddress.pincode}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Stigma Rural Packaging Guarantee:
              </span>
              <p className="text-rose-100/90 leading-relaxed">
                Orders are 100% confidential, packed in plain unbranded tamper-proof pouches with zero product labels visible from the outside.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VILLAGE ACCESS & PRODUCTS LOCATOR */}
      {activeTab === 'village_access' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Header & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-400" />
                <span>Village Delivery Access & Product Stock Locator</span>
              </h3>
              <p className="text-xs text-rose-200/80">
                Check how StreeSure reaches your village corridor with pre-positioned products and rapid delivery.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>42 Rural Corridors Mapped</span>
            </span>
          </div>

          {/* Village & PIN Code Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={villageSearchQuery}
              onChange={(e) => setVillageSearchQuery(e.target.value)}
              placeholder="Search village name (e.g. Govindgarh, Chomu, Kaladera) or 6-digit PIN code..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#13091c] border border-rose-500/30 text-white placeholder:text-rose-300/40 text-xs focus:outline-none focus:border-rose-400 transition"
            />
          </div>

          {/* Quick Village Selection Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-rose-300 whitespace-nowrap">Suggested Villages:</span>
            {RURAL_VILLAGE_COVERAGE_ZONES.map((v) => (
              <button
                key={v.villageName}
                type="button"
                onClick={() => {
                  setSelectedVillageCoverage(v);
                  setVillageSearchQuery('');
                }}
                className={`px-3 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition border ${
                  selectedVillageCoverage.villageName === v.villageName
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/40 border-rose-500/20'
                }`}
              >
                {v.villageName.split(' ')[0]} ({v.pincode})
              </button>
            ))}
          </div>

          {/* Selected Village Detailed Access & Products Card */}
          <div className="p-5 rounded-2xl bg-[#140a1e] border border-rose-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm sm:text-base font-black text-white">
                    {selectedVillageCoverage.villageName}
                  </h4>
                </div>
                <p className="text-xs text-rose-300/70">
                  {selectedVillageCoverage.block}, Jaipur Rural • PIN {selectedVillageCoverage.pincode}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedVillageCoverage.status === 'ACTIVE_15MIN' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>15–20 Min E-Bike Delivery</span>
                  </span>
                )}
                {selectedVillageCoverage.status === 'ASHA_DEPOT' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>ASHA Sub-Centre Pickup Point</span>
                  </span>
                )}
                {selectedVillageCoverage.status === 'DRONE_CORRIDOR' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Emergency Drone Drop Corridor</span>
                  </span>
                )}
              </div>
            </div>

            {/* Hub Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0b0512] border border-rose-500/20">
                <span className="text-[10px] text-rose-400 font-mono uppercase block">Nearest Rural Hub</span>
                <strong className="text-white text-xs block truncate mt-0.5">
                  {selectedVillageCoverage.nearestHub}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0512] border border-rose-500/20">
                <span className="text-[10px] text-rose-400 font-mono uppercase block">Access Distance</span>
                <strong className="text-white text-xs block mt-0.5">
                  {selectedVillageCoverage.distanceKm} km from village center
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0512] border border-rose-500/20">
                <span className="text-[10px] text-rose-400 font-mono uppercase block">Estimated Delivery ETA</span>
                <strong className="text-emerald-400 text-xs block mt-0.5">
                  ~{selectedVillageCoverage.deliveryTimeMinutes} Minutes to Doorstep
                </strong>
              </div>
            </div>

            {/* Real In-Stock Products in this Village Hub */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-pink-400" />
                <span>Live In-Stock Products Ready for Delivery in this Village Hub:</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#0e0617] border border-rose-500/20 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xl">🌿</span>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Organic Bamboo Pads</h5>
                    <p className="text-[10px] text-rose-300/70">Govt Subsidized ₹40</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-emerald-400">
                    {selectedVillageCoverage.inStockCount.pads} packs in stock
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0e0617] border border-rose-500/20 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xl">💊</span>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Cramp Relief Tablets</h5>
                    <p className="text-[10px] text-rose-300/70">Herbal & Fast Action</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-emerald-400">
                    {selectedVillageCoverage.inStockCount.tablets} units in stock
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0e0617] border border-rose-500/20 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xl">🔥</span>
                    <h5 className="text-[11px] font-bold text-white leading-tight">Herbal Heating Patches</h5>
                    <p className="text-[10px] text-rose-300/70">8-Hour Warmth Pad</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-emerald-400">
                    {selectedVillageCoverage.inStockCount.patches} units in stock
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0e0617] border border-rose-500/20 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-xl">🔬</span>
                    <h5 className="text-[11px] font-bold text-white leading-tight">StreeSure Smart Kit</h5>
                    <p className="text-[10px] text-rose-300/70">IoT Sensor & Diagnostics</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-pink-400">
                    {selectedVillageCoverage.inStockCount.smartKits} kits in stock
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: View on Google Map or Dispatch */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('live_tracking')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-rose-900/40"
              >
                <Compass className="w-4 h-4" />
                <span>Track Delivery Corridor on Google Map</span>
              </button>
            </div>
          </div>

          {/* 3 Pillars of Village Accessibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-300 font-bold text-sm">
                1
              </div>
              <h5 className="text-xs font-bold text-white">Pre-Positioned PHC Hubs</h5>
              <p className="text-[11px] text-rose-200/70 leading-relaxed">
                Products are stored directly inside rural health Sub-Centres and dark-stores, eliminating city shipping delays.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-sm">
                2
              </div>
              <h5 className="text-xs font-bold text-white">Discreet Local E-Bikes</h5>
              <p className="text-[11px] text-rose-200/70 leading-relaxed">
                Local village delivery partners bring products in plain brown tamper-evident packaging directly to doorsteps.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm">
                3
              </div>
              <h5 className="text-xs font-bold text-white">Google Maps Corridor Sync</h5>
              <p className="text-[11px] text-rose-200/70 leading-relaxed">
                Every village ward, canal lane, and landmark is geo-tagged on Google Maps for pinpoint rural navigation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VILLAGE DARK-STORE NETWORK LOCATOR (Blinkit / Zepto Style) */}
      {activeTab === 'dark_stores' && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">
                StreeSure Rural Micro-Fulfillment & Dark Store Network
              </h3>
              <p className="text-xs text-rose-200/70">
                Strategically positioned hyper-local storage hubs inside PHCs and rural community centers for 15-30 min delivery.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
              {SEED_VILLAGE_DARK_STORES.length} Active Dark-Stores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEED_VILLAGE_DARK_STORES.map((store) => (
              <div
                key={store.id}
                onClick={() => setActiveDarkStore(store)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
                  activeDarkStore.id === store.id
                    ? 'bg-rose-950/70 border-pink-500 shadow-lg shadow-rose-950/50 ring-1 ring-pink-500/40'
                    : 'bg-rose-950/25 border-rose-500/20 hover:bg-rose-900/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-pink-400" />
                      <h4 className="text-sm font-bold text-white">{store.name}</h4>
                    </div>
                    <p className="text-xs text-rose-300/80">
                      {store.block}, {store.district} ({store.state})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ⚡ {store.avgDeliveryTimeMinutes} Mins ETA
                  </span>
                </div>

                {/* Micro-Inventory Breakdown */}
                <div className="p-3 rounded-xl bg-[#09050d] border border-rose-500/20 text-[11px] space-y-2">
                  <div className="flex justify-between font-mono text-rose-200/80">
                    <span>Active E-Bike Riders on Duty:</span>
                    <strong className="text-emerald-400">{store.activeRidersCount} Active</strong>
                  </div>
                  <div className="flex justify-between font-mono text-rose-200/80">
                    <span>Coverage Radius:</span>
                    <span className="text-white">{store.deliveryRadiusKm} km Village Radius</span>
                  </div>

                  <div className="pt-2 border-t border-rose-500/15 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-1.5 rounded-lg bg-rose-950/50">
                      <span className="text-rose-300 block">Pads</span>
                      <strong className="text-white">{store.inventoryCount.pads} pcs</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-950/50">
                      <span className="text-rose-300 block">Anti-Cramp Tabs</span>
                      <strong className="text-white">{store.inventoryCount.tablets} pcs</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-950/50">
                      <span className="text-rose-300 block">Hot Bags/Patches</span>
                      <strong className="text-white">{store.inventoryCount.hotBags + store.inventoryCount.patches} pcs</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DISCREET DELIVERY INSTRUCTIONS */}
      {activeTab === 'discreet_notes' && (
        <div className="p-4 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Discreet & Safe Village Delivery Preferences</span>
            </h3>
            <p className="text-xs text-rose-200/70">
              We understand privacy in rural and joint family homes. Customize how your rider will hand over your kit.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-rose-200">
              Special Delivery Note for {selectedPartner.riderName.split(' ')[0]}:
            </label>
            <textarea
              rows={3}
              value={discreetNote}
              onChange={(e) => {
                setDiscreetNote(e.target.value);
                setNoteSaved(false);
              }}
              placeholder="e.g. Leave with ASHA Didi Radha Devi, or deliver in opaque bag without calling out loud..."
              className="w-full p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-white text-xs placeholder:text-rose-300/40 focus:outline-none focus:border-pink-500 transition"
            ></textarea>

            {/* Quick pre-set chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Hand over to ASHA Didi',
                'Call before approaching gate',
                'Leave quietly near back door',
                'No product name on outer package',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setDiscreetNote((prev) => (prev ? `${prev} • ${chip}` : chip));
                    setNoteSaved(false);
                  }}
                  className="px-3 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-500/30 text-[11px] font-medium transition"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNoteSaved(true)}
                className="py-2.5 px-5 rounded-2xl btn-berry-primary text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                {noteSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Instructions Saved & Transmitted to Rider</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Save & Notify Delivery Partner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Call Overlay Modal */}
      {isCallingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-[#1a0f26] border border-rose-500/40 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="relative w-20 h-20 mx-auto">
              <img
                src={selectedPartner.riderPhoto}
                alt={selectedPartner.riderName}
                className="w-full h-full rounded-full object-cover border-4 border-pink-500 shadow-xl"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-white animate-pulse">
                <Volume2 className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                Connecting to Rural Delivery Partner...
              </span>
              <h3 className="text-lg font-black text-white">{selectedPartner.riderName}</h3>
              <p className="text-xs text-rose-200/70">
                {selectedPartner.partnerLabel} ({selectedPartner.vehicleNumber})
              </p>
              <div className="text-sm font-mono text-pink-300 font-bold pt-1">
                Call Duration: 00:{callDuration < 10 ? `0${callDuration}` : callDuration}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/20 text-xs text-rose-200 text-left space-y-1">
              <strong className="text-emerald-400 block font-semibold">🎙️ Partner Responded:</strong>
              <p className="text-white text-[11px] leading-relaxed italic">
                "Namaste! I am on the Chomu-Govindgarh link road with your sealed StreeSure package. I will reach your Ward 4 address in approximately {minutesLeft} minutes. No need to worry, everything is packed discreetly."
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCallingRider(false)}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-4 h-4 rotate-[135deg]" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
