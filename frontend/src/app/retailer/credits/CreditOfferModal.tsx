// app/retailer/credits/CreditOfferModal.tsx
// Simple offer form — no card entry (card already saved via CardSetupModal)
'use client';
import { useState } from 'react';
import { createCredit, SavedCard, FarmerCard } from '@/services/credits.service';

type Props = {
  farmer:    FarmerCard;
  savedCard: SavedCard;
  onClose:   () => void;
  onSuccess: () => void;
};

export default function CreditOfferModal({ farmer, savedCard, onClose, onSuccess }: Props) {
  const [amount, setAmount]   = useState('');
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const canSubmit = amountNum > 0 && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createCredit({ borrowerId: farmer.id, amount: amountNum, note: note || undefined });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit offer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Offer Credit</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              to <span className="font-semibold text-gray-700">{farmer.name ?? farmer.email}</span>
            </p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Farmer trust info */}
        <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <svg className="w-3.5 h-3.5 text-[#2B6E44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            Trust Score: <strong className="text-[#2B6E44]">{farmer.score}</strong>
          </div>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500">
            Orders: <strong className="text-gray-700">{farmer.orderCount}</strong>
          </span>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Saved card display */}
          {savedCard && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <div className="w-8 h-6 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white text-[9px] font-black italic uppercase">{savedCard.brand}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">•••• {savedCard.last4}</p>
                <p className="text-xs text-gray-400">Expires {savedCard.expMonth}/{savedCard.expYear}</p>
              </div>
              <span className="text-xs text-[#2B6E44] font-semibold bg-[#e8f5ee] px-2 py-0.5 rounded-full">
                Saved
              </span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Credit Amount (USD)
            </label>
            <div className={`flex items-center border rounded-xl px-4 py-2.5 transition`}>
              <span className="text-gray-400 mr-2 text-sm">$</span>
              <input
                type="number" min="1" 
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 text-sm text-gray-800 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Message <span className="font-normal text-gray-400">— optional</span>
            </label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. For your next harvest season..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#2B6E44] focus:ring-2 focus:ring-[#2B6E44]/20 transition resize-none"
            />
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-amber-700">
              Your card will be <strong>charged immediately</strong>. If the farmer rejects or you cancel,
              a full refund will be issued to your card automatically.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit}
            className="w-full bg-[#2B6E44] text-white font-semibold py-3 rounded-xl hover:bg-[#185c3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading
              ? <><Spinner /> Processing...</>
              : `Offer Credit $${amountNum > 0 ? amountNum.toFixed(2) : '0.00'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}