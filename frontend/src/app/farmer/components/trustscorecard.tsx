// components/dashboard/TrustScoreCard.tsx
'use client';

/**
 * TRUST SCORE CARD
 * 
 * Displays farmer's trust score with a circular progress indicator.
 * Trust score affects micro-credit limit and platform benefits.
 * 
 * Props:
 * - score: current trust score (0-1000)
 * - maxScore: maximum possible score (default 1000)
 * 
 * Score is calculated based on:
 * - KYC verification
 * - Transaction history
 * - Delivery success rate
 * - Time on platform
 */

interface TrustScoreCardProps {
  score: number;
  maxScore?: number;
}

export default function TrustScoreCard({ score, maxScore = 1000 }: TrustScoreCardProps) {
  // Calculate percentage for circular progress
  const percentage = (score / maxScore) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ShieldIcon />
        <div>
          <h3 className="font-bold text-gray-900">Trust Score</h3>
          <p className="text-sm text-gray-500">Your reputation score in the network</p>
        </div>
      </div>

      {/* Circular Progress */}
      <div className="flex justify-center mb-6">
        <CircularProgress
          score={score}
          maxScore={maxScore}
          percentage={percentage}
        />
      </div>

      {/* Score Breakdown (placeholder) */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <ScoreItem
          label="KYC Verification"
          value="Verified"
          color="text-green-600"
        />
        <ScoreItem
          label="Delivery Success"
          value="98.5%"
          color="text-blue-600"
        />
        <ScoreItem
          label="Response Time"
          value="< 2 hours"
          color="text-purple-600"
        />
      </div>

      {/* Improve Score Button */}
      <button className="w-full mt-6 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
        How to Improve Score
      </button>
    </div>
  );
}

/**
 * CIRCULAR PROGRESS SUB-COMPONENT
 * 
 * SVG-based circular progress indicator
 */
interface CircularProgressProps {
  score: number;
  maxScore: number;
  percentage: number;
}

function CircularProgress({ score, maxScore, percentage }: CircularProgressProps) {
  // SVG circle calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* SVG Circle */}
      <svg className="transform -rotate-90" width="180" height="180">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#f3f4f6"
          strokeWidth="12"
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#f59e0b"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Score Text (centered) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-gray-900">{score}</span>
        <span className="text-sm text-gray-500 mt-1">/ {maxScore}</span>
      </div>
    </div>
  );
}

/**
 * SCORE ITEM SUB-COMPONENT
 * 
 * Individual metric in score breakdown
 */
interface ScoreItemProps {
  label: string;
  value: string;
  color: string;
}

function ScoreItem({ label, value, color }: ScoreItemProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// Shield Icon
function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}