'use client';
import { useEffect, useState } from 'react';
import { getMarketplace, getSavedCard,getMyOffers, Credit, RetailerStats } from '@/services/credits.service';
import { FarmerCard, SavedCard  } from '@/services/credits.service';
import CreditOfferModal from '../CreditOfferModal';
import CardSetupModal from '../CardSetupModal';

export default function MarketplacePage() {
  const [farmers, setFarmers]         = useState<FarmerCard[]>([]);
  const [offers, setOffers] = useState<Credit[]>([]);
  const [stats, setStats] = useState<RetailerStats | null>(null);
  const [savedCard, setSavedCard]     = useState<SavedCard>(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerCard | null>(null);
  const [showCardSetup, setShowCardSetup]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [farmersData, cardData, offersData] = await Promise.all([
        getMarketplace(),
        getSavedCard(),
        getMyOffers(),
      ]);
      setFarmers(farmersData);
      setSavedCard(cardData.paymentMethod);
      setStats(offersData.stats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOfferClick = (farmer: FarmerCard) => {
    if (!savedCard) {
      // No card saved yet — show card setup first
      setSelectedFarmer(farmer);
      setShowCardSetup(true);
    } else {
      setSelectedFarmer(farmer);
    }
  };

  const filtered = farmers.filter(f =>
    (f.name ?? f.email).toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const pendingCount = farmers.length; 
  const maxScore = farmers.length ? Math.max(...farmers.map(f => f.score)): 0;
  const avgScore = farmers.length? Math.round(  farmers.reduce((sum, f) => sum + f.score, 0) / farmers.length): 0;
  const totalSent = stats?.totalReserved ?? 0;

  return (
    <div className="p-8 mt-16">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offer Credit to Trusted Farmers</h1>
        <p className="text-gray-500 text-sm mt-1">
          Discover verified farmers and issue secured credit offers directly based on their performance status.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Trusted farmers', value: pendingCount, sub: 'Farmers waiting for credit' },
          { label: 'Maximum strust score', value: maxScore, sub: '' },
          {label: 'Average Farmers Score' , value:avgScore , },
          { label: 'Total Reserved', value: totalSent,sub:'sum of credits waiting for approval', green: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.green ? 'text-[#2B6E44]' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + filters bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 flex-1 max-w-sm bg-white">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by farmer name..."
            className="text-sm text-gray-700 outline-none flex-1 bg-transparent"
          />
        </div>
        {/* Saved card indicator */}
        {savedCard ? (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2">
            <div className="w-6 h-4 bg-gray-800 rounded flex items-center justify-center">
              <span className="text-white text-[8px] font-black italic uppercase">{savedCard.brand}</span>
            </div>
            •••• {savedCard.last4}
            <span className="text-[#2B6E44] font-semibold">✓</span>
          </div>
        ) : (
          <button onClick={() => setShowCardSetup(true)}
            className="text-xs text-white bg-[#2B6E44] px-4 py-2.5 rounded-xl font-semibold hover:bg-[#185c3d] transition-colors">
            + Add Card
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        <h2 className="text-sm font-semibold text-gray-700">Verified Farmer Marketplace</h2>
        <span className="text-xs text-gray-400">{filtered.length} farmers</span>
      </div>

      {/* Farmer grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-52 animate-pulse"/>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(farmer => (
            <FarmerCardComponent
              key={farmer.id}
              farmer={farmer}
              onOffer={() => handleOfferClick(farmer)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCardSetup && (
        <CardSetupModal
          onClose={() => setShowCardSetup(false)}
          onSuccess={() => {
            setShowCardSetup(false);
            load(); // refresh saved card
          }}
        />
      )}

      {selectedFarmer && savedCard && (
        <CreditOfferModal
          farmer={selectedFarmer}
          savedCard={savedCard}
          onClose={() => setSelectedFarmer(null)}
          onSuccess={() => {
            setSelectedFarmer(null);
            // Optionally show toast
          }}
        />
      )}
    </div>
  );
}

// ── Farmer card component ──────────────────────────────────────────────────
function FarmerCardComponent({ farmer, onOffer }: { farmer: FarmerCard; onOffer: () => void }) {
  const scoreColor =
    farmer.score >= 60 ? 'text-[#2B6E44] bg-[#e8f5ee]' :
    farmer.score >= 20 ? 'text-amber-600 bg-amber-50' :
                         'text-gray-500 bg-gray-100';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Farmer name + verified badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-[#e8f5ee] rounded-full flex items-center justify-center flex-shrink-0">
            <svg  className="w-4 h-4 text-[#2B6E44]"  viewBox="0 0 460 460" fill="currentColor" xmlns="http://www.w3.org/2000/svg"            >
            <g>
            <path d="M403.204,336.001c-0.46-0.485-0.984-0.907-1.558-1.256c-12.934-10.356-27.465-18.792-43.163-24.872c-0.406-0.199-0.832-0.363-1.276-0.486c-16.135-6.094-33.475-9.705-51.556-10.369c-1.362-1.89-3.576-3.125-6.083-3.125s-4.722,1.235-6.083,3.125c-18.082,0.665-35.422,4.275-51.556,10.369c-0.445,0.124-0.872,0.288-1.279,0.487
		        c-15.697,6.081-30.228,14.516-43.161,24.871c-0.575,0.349-1.099,0.771-1.56,1.257c-36.586,30.029-59.967,75.583-59.967,126.498
		        c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5c0-40.628,16.395-77.495,42.908-104.348v102.727c0,0.557,0.065,1.099,0.18,1.621
		        c0.741,3.362,3.734,5.879,7.32,5.879s6.578-2.517,7.32-5.879c0.115-0.522,0.18-1.064,0.18-1.621V344.867
		        c8.509-6.575,17.746-12.249,27.57-16.878v63.088c0,4.143,3.357,7.5,7.5,7.5h111.255c4.143,0,7.5-3.357,7.5-7.5v-63.088
		        c9.824,4.629,19.062,10.302,27.57,16.878v116.012c0,0.557,0.065,1.099,0.18,1.621c0.741,3.362,3.734,5.879,7.32,5.879s6.578-2.517,7.32-5.879c0.115-0.522,0.18-1.064,0.18-1.621V358.151c26.514,26.853,42.908,63.72,42.908,104.349c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5C463.172,411.585,439.79,366.031,403.204,336.001z M251.438,383.577v-61.68c12.845-4.409,26.478-7.108,40.628-7.815v19.313c0,4.143,3.357,7.5,7.5,7.5s7.5-3.357,7.5-7.5v-19.313c14.149,0.707,27.782,3.406,40.627,7.814v61.681H251.438z"/>
	        <path d="M157.678,143.304V7.5c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v128.304h-30.283V7.5c0-4.143-3.357-7.5-7.5-7.5
		      s-7.5,3.357-7.5,7.5v128.304H67.111V7.5c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v128.304H21.828V7.5
		      c0-4.143-3.357-7.5-7.5-7.5s-7.5,3.357-7.5,7.5v135.804c0,21.384,17.396,38.78,38.78,38.78h29.145V462.5c0,4.143,3.357,7.5,7.5,7.5
		      s7.5-3.357,7.5-7.5V182.084h29.145C140.281,182.084,157.678,164.688,157.678,143.304z M23.047,150.804h118.412
		      c-3.149,9.447-12.07,16.28-22.561,16.28H45.608C35.117,167.084,26.196,160.251,23.047,150.804z"/>
	        <path d="M180.893,182.084h33.527c-0.265,2.752-0.407,5.521-0.407,8.291c0,47.175,38.379,85.554,85.554,85.554
		      c47.174,0,85.553-38.379,85.553-85.554c0-2.77-0.143-5.539-0.408-8.291h33.248c4.143,0,7.5-3.357,7.5-7.5s-3.357-7.5-7.5-7.5
		      h-36.028l-17.409-72.345c-1.72-7.146-6.124-13.07-12.4-16.68c-6.278-3.609-13.61-4.437-20.655-2.328l-31.107,9.313l-31.106-9.313
		      c-7.021-2.104-14.37-1.294-20.691,2.278c-6.322,3.571-10.808,9.446-12.631,16.545l-18.632,72.529h-36.405
		      c-4.143,0-7.5,3.357-7.5,7.5S176.75,182.084,180.893,182.084z M255.938,91.069c2.734-1.545,5.934-1.89,9.011-0.969l33.258,9.958
		      c1.404,0.42,2.898,0.42,4.303,0l33.259-9.958c3.055-0.914,6.207-0.572,8.874,0.962c2.669,1.535,4.549,4.087,5.295,7.187
		      l16.565,68.835H232.784l17.673-68.797C251.256,95.178,253.202,92.615,255.938,91.069z M370.119,190.375
		      c0,38.903-31.649,70.554-70.553,70.554s-70.554-31.65-70.554-70.554c0-2.776,0.181-5.545,0.502-8.291h140.103
		      C369.938,184.831,370.119,187.601,370.119,190.375z"/>
	        <path d="M355.19,413.58h-61.25c-4.143,0-7.5,3.357-7.5,7.5s3.357,7.5,7.5,7.5h61.25c4.143,0,7.5-3.357,7.5-7.5	S359.333,413.58,355.19,413.58z"/>
	        <path d="M263.94,413.58h-20c-4.143,0-7.5,3.357-7.5,7.5s3.357,7.5,7.5,7.5h20c4.143,0,7.5-3.357,7.5-7.5		S268.083,413.58,263.94,413.58z"/>
          </g>
            
          </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{farmer.name ?? 'Unnamed Farmer'}</p>
            <p className="text-xs text-gray-400 truncate max-w-[140px]">{farmer.email}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
          {farmer.score} Trust
        </span>
      </div>

      {/* Stats row */}
      
      <div className="grid grid-cols-2 gap-2">       
      <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-baseline gap-1">
        <span className="text-base font-bold text-gray-800">{farmer.orderCount}</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">orders</span>
      </div>
      <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-baseline gap-1">
          <p className="text-base font-bold text-gray-800">{farmer.totalSales}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Sales</p>
      </div>
      </div>

      {/* Stripe account indicator */}
      <div className="flex items-center gap-1.5 text-[11px]">
        {farmer.hasStripeAccount ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"/>
            <span className="text-emerald-600 font-medium">Stripe account connected</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block"/>
            <span className="text-gray-400">No Stripe account yet</span>
          </>
        )}
      </div>

      <button
        onClick={onOffer}
        disabled={!farmer.hasStripeAccount}
        className="w-full bg-[#2B6E44] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#185c3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Offer Credit
      </button>
    </div>
  );
}