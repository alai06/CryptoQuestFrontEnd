import { useState } from 'react';
import { ArrowLeft, Wand2, Plus, Minus, X, Download, Grid3x3, Trash2, AlertCircle, Menu } from 'lucide-react';
import { generateCryptarithm } from '../utils/cryptarithmSolver';
import VerticalCryptarithm from './VerticalCryptarithm';
import CrossedCryptarithm from './CrossedCryptarithm';

interface GeneratorModeProps {
  onBack: () => void;
  onCryptarithmGenerated?: (equation: string, solution: Record<string, string>) => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface GeneratedCryptarithm {
  id: string;
  equation: string;
  timestamp: Date;
}

export default function GeneratorMode({ onBack, onCryptarithmGenerated, isMobile = false, onOpenSidebar }: GeneratorModeProps) {
  const [operation, setOperation] = useState<'addition' | 'subtraction' | 'multiplication' | 'crossed' | 'long-multiplication'>('addition');
  const [numTerms, setNumTerms] = useState(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generated, setGenerated] = useState<GeneratedCryptarithm[]>([]);
  const [selectedCryptarithm, setSelectedCryptarithm] = useState<string | null>(null);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customWordsText, setCustomWordsText] = useState<string>('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  const MAX_CRYPTARITHMS = 50;
  const MAX_CUSTOM_WORDS = 50;

  const handleGenerate = () => {
    if (generated.length >= MAX_CRYPTARITHMS) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 5000);
      return;
    }

    const equation = generateCryptarithm(operation, numTerms, difficulty, customWords.length > 0 ? customWords : undefined);
    const newCryptarithm: GeneratedCryptarithm = {
      id: Date.now().toString(),
      equation,
      timestamp: new Date(),
    };
    setGenerated([newCryptarithm, ...generated]);
    setSelectedCryptarithm(equation);

    if (onCryptarithmGenerated) {
      onCryptarithmGenerated(equation, {});
    }
  };

  const handleExportAll = () => {
    const exportData = {
      cryptarithms: generated.map(c => ({
        equation: c.equation,
        timestamp: c.timestamp,
      })),
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptarithms-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSingle = (equation: string) => {
    const exportData = {
      equation,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptarithm-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target?.result as string);
        if (data.cryptarithms) {
          const importedCryptarithms: GeneratedCryptarithm[] = data.cryptarithms.map((c: any) => ({
            id: Date.now().toString(),
            equation: c.equation,
            timestamp: new Date(c.timestamp),
          }));
          setGenerated([...importedCryptarithms, ...generated]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDelete = (id: string) => {
    setGenerated(generated.filter(c => c.id !== id));
    if (selectedCryptarithm && generated.find(c => c.id === id)?.equation === selectedCryptarithm) {
      setSelectedCryptarithm(null);
    }
  };

  const handleImportWords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const words = text
          .split(/[\r\n]+/)
          .map(word => word.trim().toUpperCase())
          .filter(word => /^[A-Z]+$/.test(word) && word.length >= 1 && word.length <= 10);

        const uniqueWords = Array.from(new Set(words));
        setCustomWords(uniqueWords);
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleClearCustomWords = () => {
    setCustomWords([]);
    setCustomWordsText('');
  };

  const handleCustomWordsTextChange = (text: string) => {
    const lines = text.split(/[\r\n]+/).filter(line => line.trim());
    if (lines.length > MAX_CUSTOM_WORDS) {
      return; // Don't allow more than MAX_CUSTOM_WORDS lines
    }
    setCustomWordsText(text);

    // Update custom words in real-time
    const words = text
      .split(/[\r\n]+/)
      .map(word => word.trim().toUpperCase())
      .filter(word => /^[A-Z]+$/.test(word) && word.length >= 1 && word.length <= 10);

    const uniqueWords = Array.from(new Set(words));
    setCustomWords(uniqueWords.slice(0, MAX_CUSTOM_WORDS));
  };

  const handleAddCustomWords = () => {
    const lines = customWordsText.split(/[\r\n]+/).filter(line => line.trim());
    if (lines.length > MAX_CUSTOM_WORDS) {
      return; // Don't allow more than MAX_CUSTOM_WORDS lines
    }
    setCustomWordsText('');

    // Update custom words in real-time
    const words = lines
      .map(word => word.trim().toUpperCase())
      .filter(word => /^[A-Z]+$/.test(word) && word.length >= 1 && word.length <= 10);

    const uniqueWords = Array.from(new Set([...customWords, ...words]));
    setCustomWords(uniqueWords.slice(0, MAX_CUSTOM_WORDS));
  };

  return (
    <div className="min-h-screen px-8 py-16 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Limit Warning */}
        {showLimitWarning && (
          <div className="bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF3B30] flex-shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-[#1D1D1F] text-[14px] font-medium">
                Limite atteinte ! Vous avez généré le maximum de {MAX_CRYPTARITHMS} cryptarithmes.
              </p>
              <p className="text-[#86868B] text-[12px] mt-1">
                Veuillez supprimer ou exporter certains cryptarithmes avant d'en générer de nouveaux.
              </p>
            </div>
          </div>
        )}

        {/* Generation Progress */}
        {generated.length > 0 && (
          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-medium text-[#1D1D1F]">Cryptarithmes générés</span>
              <span className={`text-[14px] font-medium ${generated.length >= MAX_CRYPTARITHMS ? 'text-[#FF3B30]' : 'text-[#86868B]'}`}>
                {generated.length} / {MAX_CRYPTARITHMS}
              </span>
            </div>
            <div className="w-full bg-[#E5E5E5] rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${generated.length >= MAX_CRYPTARITHMS
                  ? 'bg-[#FF3B30]'
                  : generated.length >= MAX_CRYPTARITHMS * 0.8
                    ? 'bg-[#FF9500]'
                    : 'bg-[#0096BC]'
                  }`}
                style={{ width: `${(generated.length / MAX_CRYPTARITHMS) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8 mb-6">
          {/* Back Button - Mobile only */}
          {isMobile && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-8 text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2} />
              <span className="text-[14px] font-medium">Retour</span>
            </button>
          )}

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[#0096BC] rounded-[12px]">
              <Wand2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Paramètres de génération</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Operation Type */}
            <div>
              <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
                Type d'opération
              </label>
              <div className="space-y-2">
                {[
                  { value: 'addition', label: 'Addition', icon: Plus },
                  { value: 'subtraction', label: 'Soustraction', icon: Minus },
                  { value: 'multiplication', label: 'Multiplication', icon: X },
                  { value: 'crossed', label: 'Opération croisée', icon: Grid3x3 },
                  { value: 'long-multiplication', label: 'Multiplication longue', icon: Grid3x3 },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setOperation(value as any)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-[12px] transition-all text-[14px] font-medium
                      ${operation === value
                        ? 'bg-[#0096BC] text-white'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E5]'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty and Number of Terms */}
            <div>
              <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
                Niveau de difficulté
              </label>
              <div className="space-y-2 mb-6">
                {[
                  { value: 'easy', label: 'Facile' },
                  { value: 'medium', label: 'Moyen' },
                  { value: 'hard', label: 'Difficile' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value as any)}
                    className={`
                      w-full px-3 py-2 rounded-[12px] transition-all text-[14px] font-medium
                      ${difficulty === value
                        ? 'bg-[#0096BC] text-white'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E5]'
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Number of Terms */}
              {!['crossed', 'long-multiplication'].includes(operation) && (
                <div>
                  <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">
                    Nombre de termes : {numTerms}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    value={numTerms}
                    onChange={(e) => setNumTerms(Number(e.target.value))}
                    className="w-full accent-[#0096BC]"
                  />
                  <div className="flex justify-between text-[12px] text-[#86868B] mt-1">
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Words Text Area */}
            <div>
              <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
                Mots personnalisés
              </label>
              <textarea
                value={customWordsText}
                onChange={(e) => handleCustomWordsTextChange(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E5E5E5] text-[#1D1D1F] rounded-[12px] hover:border-[#0096BC] transition-colors text-[14px] resize-none font-mono"
                placeholder="SEND&#10;MORE&#10;MONEY"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[#86868B] text-[12px]">
                  Un mot par ligne (1-10 lettres, max {MAX_CUSTOM_WORDS})
                </p>
                <p className={`text-[12px] font-medium ${customWords.length >= MAX_CUSTOM_WORDS ? 'text-[#FF3B30]' : 'text-[#86868B]'}`}>
                  {customWords.length} / {MAX_CUSTOM_WORDS}
                </p>
              </div>
              {customWords.length > 0 && (
                <button
                  onClick={handleClearCustomWords}
                  className="w-full py-2 bg-white hover:bg-[#FFF5F5] text-[#FF3B30] rounded-[12px] transition-all flex items-center justify-center gap-2 text-[14px] font-medium border border-[#FFE5E5] mt-3"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  Effacer tout
                </button>
              )}
            </div>

            {/* Actions */}
            <div>
              <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
                Actions
              </label>
              <button
                onClick={handleGenerate}
                className="w-full py-3 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all flex items-center justify-center gap-2 mb-2 font-medium"
              >
                <Wand2 className="w-5 h-5" strokeWidth={1.5} />
                Générer
              </button>

              {generated.length > 0 && (
                <button
                  onClick={handleExportAll}
                  className="w-full py-2 bg-[#F5F5F7] hover:bg-[#E5E5E5] text-[#1D1D1F] rounded-[12px] transition-all flex items-center justify-center gap-2 text-[14px] font-medium"
                >
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  Exporter ({generated.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Words Display */}
        {customWords.length > 0 && (
          <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-semibold tracking-[-0.01em]">Mots validés ({customWords.length}/{MAX_CUSTOM_WORDS})</h3>
              <button
                onClick={handleClearCustomWords}
                className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF5F5] rounded-[12px] transition-all"
                title="Effacer tous les mots"
              >
                <Trash2 className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {customWords.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-[#E8F7FB] border border-[#0096BC] text-[#0096BC] rounded-[12px] text-[14px] font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
            <p className="text-[#86868B] text-[14px] mt-3">
              Ces mots seront utilisés pour générer les cryptarithmes
            </p>
          </div>
        )}

        {/* Add Custom Words */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-semibold tracking-[-0.01em]">Ajouter des mots personnalisés</h3>
          </div>
          <textarea
            value={customWordsText}
            onChange={(e) => handleCustomWordsTextChange(e.target.value)}
            className="w-full h-24 px-3 py-2 bg-[#F5F5F7] border border-[#E5E5E5] text-[#1D1D1F] rounded-[12px] text-[14px] resize-y"
            placeholder="Un mot par ligne (1-10 lettres)"
          />
          <button
            onClick={handleAddCustomWords}
            className="w-full py-2 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all flex items-center justify-center gap-2 mt-2 font-medium"
          >
            Ajouter
          </button>
        </div>

        {/* Generated List */}
        <div className="bg-white rounded-[12px] border border-[#E5E5E5] p-8">
          <h2 className="text-[24px] font-bold mb-6 tracking-[-0.02em]">Cryptarithmes générés</h2>

          {generated.length === 0 ? (
            <div className="text-center py-12">
              <Wand2 className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-[#86868B] text-[14px]">
                Aucun cryptarithme généré pour le moment.
              </p>
              <p className="text-[#86868B] text-[14px] mt-2">
                Configurez les paramètres et cliquez sur "Générer"
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {generated.map((crypto) => (
                <div
                  key={crypto.id}
                  className={`
                    p-4 rounded-[12px] border transition-all cursor-pointer
                    ${selectedCryptarithm === crypto.equation
                      ? 'border-[#0096BC] bg-[#E8F7FB]'
                      : 'border-[#E5E5E5] hover:border-[#0096BC] bg-white'
                    }
                  `}
                  onClick={() => setSelectedCryptarithm(crypto.equation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[18px] font-mono text-[#1D1D1F] mb-1 font-medium">
                        {crypto.equation}
                      </p>
                      <p className="text-[12px] text-[#86868B]">
                        Généré le {crypto.timestamp.toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportSingle(crypto.equation);
                        }}
                        className="p-2 text-[#86868B] hover:text-[#0096BC] hover:bg-[#E8F7FB] rounded-[12px] transition-all"
                      >
                        <Download className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(crypto.id);
                        }}
                        className="p-2 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FFF5F5] rounded-[12px] transition-all"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCryptarithm && (
            <div className="mt-6 p-8 bg-[#F5F5F7] rounded-[12px]">
              <h3 className="text-[20px] font-semibold mb-6 text-center tracking-[-0.01em]">Cryptarithme sélectionné</h3>
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-[12px] p-8 border border-[#E5E5E5]">
                  {selectedCryptarithm.includes('|') ? (
                    <CrossedCryptarithm equation={selectedCryptarithm} size="large" />
                  ) : (
                    <VerticalCryptarithm equation={selectedCryptarithm} size="large" />
                  )}
                </div>
              </div>
              <p className="text-[#86868B] text-center text-[14px]">
                Vous pouvez maintenant résoudre ce cryptarithme dans le mode Résolution ou l'exporter
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}