import { Menu } from 'lucide-react';

interface MobilePageHeaderProps {
  title: string;
  onOpenSidebar: () => void;
}

/**
 * Barre de navigation fixe utilisée en mode mobile sur toutes les pages.
 * Remplace le copié-collé présent dans TutorialMode, SolverMode,
 * GeneratorMode, GameMode et ProgressDashboard.
 */
export default function MobilePageHeader({ title, onOpenSidebar }: MobilePageHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-40 px-5 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenSidebar}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00AFD7] to-[#007EA1] flex items-center justify-center active:scale-95 transition-transform shadow-lg"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold text-[#1D1D1F]">{title}</h1>
        {/* Spacer pour centrer le titre */}
        <div className="w-10 h-10" aria-hidden />
      </div>
    </div>
  );
}
