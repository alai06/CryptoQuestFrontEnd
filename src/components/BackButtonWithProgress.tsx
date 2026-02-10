import { ArrowLeft } from 'lucide-react';

interface BackButtonWithProgressProps {
  onBack: () => void;
  currentStep?: number;
  totalSteps?: number;
  showProgress?: boolean;
}

export default function BackButtonWithProgress({
  onBack,
  currentStep,
  totalSteps,
  showProgress = false,
}: BackButtonWithProgressProps) {
  return (
    <div className="mb-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors group mb-4"
        aria-label="Retour"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        <span className="text-[14px] font-medium">Retour</span>
      </button>

      {/* Progress Bar */}
      {showProgress && currentStep && totalSteps && (
        <div className="space-y-3">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#86868B]">
              Étape {currentStep} / {totalSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < currentStep ? 'bg-[#0096BC]' : 'bg-[#E5E5E5]'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
