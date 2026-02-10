import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Menu } from 'lucide-react';
import DragDropBoard from './DragDropBoard';
import VerticalCryptarithm from './VerticalCryptarithm';

interface TutorialModeProps {
  onComplete: () => void;
  onBack: () => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

const tutorialSteps = [
  {
    title: 'Bienvenue dans les Cryptarithmes',
    description: 'Un cryptarithme est un puzzle mathématique où chaque lettre représente un chiffre unique (0-9).',
    example: 'SEND + MORE = MONEY',
    interactive: false,
  },
  {
    title: 'Les règles fondamentales',
    description: 'Chaque lettre correspond à un chiffre différent. Les lettres en début de mot ne peuvent pas être 0.',
    example: 'TWO + TWO = FOUR',
    interactive: false,
  },
  {
    title: 'Essayez vous-même',
    description: 'Glissez-déposez les chiffres sur les lettres pour résoudre ce cryptarithme simple.',
    example: 'A + A = B',
    solution: { A: '1', B: '2' },
    interactive: true,
  },
];

export default function TutorialMode({ onComplete, onBack, isMobile = false, onOpenSidebar }: TutorialModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep && stepCompleted) {
      onComplete();
      onBack();
    } else if (!step.interactive || stepCompleted) {
      setCurrentStep(currentStep + 1);
      setStepCompleted(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setStepCompleted(false);
    }
  };

  const handleStepComplete = () => {
    setStepCompleted(true);
  };

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Header - Only on mobile */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-[#F5F5F7] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-[#1D1D1F]" strokeWidth={2} />
              </button>
              <h1 className="text-[18px] font-bold text-[#1D1D1F]">Tutoriel</h1>
              <button
                onClick={onOpenSidebar}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-12 rounded-full transition-all ${index <= currentStep ? 'bg-[#0096BC]' : 'bg-[#E5E5E5]'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block bg-[#F5F5F7] text-[#1D1D1F] px-4 py-1.5 rounded-full mb-6 text-[14px] font-medium">
              Étape {currentStep + 1} / {tutorialSteps.length}
            </div>
            <h2 className="text-[32px] font-bold mb-4 tracking-[-0.02em]">{step.title}</h2>
            <p className="text-[#86868B] text-[16px] leading-relaxed max-w-2xl mx-auto">
              {step.description}
            </p>
          </div>

          {/* Content */}
          <div className="mb-10">
            {step.interactive && step.solution ? (
              <DragDropBoard
                equation={step.example}
                solution={step.solution}
                onSolved={handleStepComplete}
              />
            ) : (
              <div className="flex justify-center">
                <div className="bg-[#F5F5F7] rounded-[12px] p-12">
                  <VerticalCryptarithm equation={step.example} size="large" />
                </div>
              </div>
            )}
          </div>

          {/* Success Message */}
          {stepCompleted && (
            <div className="mb-8 bg-[#F5FFF5] border border-[#D4F4DD] rounded-[12px] p-5 flex items-center gap-3">
              <div className="bg-[#34C759] rounded-full p-1.5">
                <Check className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-[#1D1D1F] text-[14px] font-medium">
                Excellent travail ! Vous avez résolu ce cryptarithme.
              </span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-[12px] transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[#1D1D1F] hover:bg-[#F5F5F7] text-[14px] font-medium"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              <span>Précédent</span>
            </button>

            <button
              onClick={handleNext}
              disabled={step.interactive && !stepCompleted}
              className="flex items-center gap-2 px-6 py-3 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[14px] font-medium"
            >
              <span>{isLastStep ? 'Terminer' : 'Suivant'}</span>
              {isLastStep ? <Check className="w-5 h-5" strokeWidth={1.5} /> : <ArrowRight className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}