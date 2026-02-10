import { Check } from 'lucide-react';
import { Language, getTranslations } from '../utils/translations';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSelector({ 
  currentLanguage, 
  onLanguageChange, 
  isOpen, 
  onClose 
}: LanguageSelectorProps) {
  const t = getTranslations(currentLanguage);

  if (!isOpen) return null;

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-8 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[24px] font-black mb-6 text-[#1D1D1F]">
          {t.languageTitle}
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => handleLanguageSelect('fr')}
            className="w-full flex items-center justify-between p-4 bg-[#FBFBFD] rounded-2xl hover:bg-[#F5F5F7] transition-all active:scale-[0.98]"
          >
            <span className="text-[17px] font-semibold text-[#1D1D1F]">
              {t.languageFrench}
            </span>
            {currentLanguage === 'fr' && (
              <div className="w-6 h-6 rounded-full bg-[#0096BC] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </button>

          <button
            onClick={() => handleLanguageSelect('en')}
            className="w-full flex items-center justify-between p-4 bg-[#FBFBFD] rounded-2xl hover:bg-[#F5F5F7] transition-all active:scale-[0.98]"
          >
            <span className="text-[17px] font-semibold text-[#1D1D1F]">
              {t.languageEnglish}
            </span>
            {currentLanguage === 'en' && (
              <div className="w-6 h-6 rounded-full bg-[#0096BC] flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
