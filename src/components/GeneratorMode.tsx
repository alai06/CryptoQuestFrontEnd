import { useState, useEffect } from 'react';
import { ArrowLeft, Wand2, Plus, X, Download, Grid3x3, Trash2, AlertCircle, Menu, Loader } from 'lucide-react';
import { generateCryptarithms as generateCryptarithmsAPI, getApiLimits } from '../services/cryptatorApi';
import VerticalCryptarithm from './VerticalCryptarithm';
import CrossedCryptarithm from './CrossedCryptarithm';
import BackButtonWithProgress from './BackButtonWithProgress';
import { SelectField, NumberInput, CheckboxField } from './FormComponents';
import SolutionDisplay from './SolutionDisplay';

interface GeneratorModeProps {
  onBack: () => void;
  onCryptarithmGenerated?: (equation: string, solution: Record<string, string>) => void;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

interface GeneratedCryptarithm {
  id: string;
  equation: string;
  solution: string;
  timestamp: Date;
}

export default function GeneratorMode({ onBack, onCryptarithmGenerated, isMobile = false, onOpenSidebar }: GeneratorModeProps) {
  const [operation, setOperation] = useState<'addition' | 'multiplication' | 'crossed' | 'long-multiplication'>('addition');
  const [generated, setGenerated] = useState<GeneratedCryptarithm[]>([]);
  const [selectedCryptarithm, setSelectedCryptarithm] = useState<GeneratedCryptarithm | null>(null);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customWordsText, setCustomWordsText] = useState<string>('');
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Advanced API options
  const [solutionLimit, setSolutionLimit] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(60);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [allowLeadingZeros, setAllowLeadingZeros] = useState<boolean>(false);
  const [rightMemberType, setRightMemberType] = useState<'UNIQUE' | 'FREE' | 'FIXED'>('UNIQUE');
  const [minWords, setMinWords] = useState<number | undefined>(undefined);
  const [maxWords, setMaxWords] = useState<number | undefined>(undefined);
  const [lowerBound, setLowerBound] = useState<number | undefined>(undefined);
  const [upperBound, setUpperBound] = useState<number | undefined>(undefined);
  const [threads, setThreads] = useState<number>(1);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [crossGridSize, setCrossGridSize] = useState<number | undefined>(undefined);

  const MAX_CRYPTARITHMS = 50;
  const MAX_CUSTOM_WORDS = 50;
  const API_LIMITS = getApiLimits();

    // Charger les cryptarithmes sauvegardés au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('generatedCryptarithms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGenerated(parsed.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        })));
      } catch (error) {
        console.error('Erreur lors du chargement des cryptarithmes:', error);
      }
    }
  }, []);

  // Sauvegarder automatiquement les cryptarithmes générés
  useEffect(() => {
    if (generated.length > 0) {
      localStorage.setItem('generatedCryptarithms', JSON.stringify(generated));
    }
  }, [generated]);

  // Synchroniser le symbole d'opération avec le type d'opération sélectionné
  const getOperatorSymbol = (): string => {
    switch (operation) {
      case 'addition': return '+';
      case 'multiplication': return '*';
      case 'crossed': return 'CROSS';
      case 'long-multiplication': return 'LMUL';
      default: return '+';
    }
  };

  const handleGenerate = async () => {
    if (generated.length >= MAX_CRYPTARITHMS) {
      setShowLimitWarning(true);
      setTimeout(() => setShowLimitWarning(false), 5000);
      return;
    }

    if (customWords.length === 0) {
      setError('Veuillez ajouter au moins un mot personnalisé');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await generateCryptarithmsAPI({
        words: customWords,
        operatorSymbol: getOperatorSymbol(),
        solutionLimit: solutionLimit,
        timeLimit: timeLimit,
        shuffle: shuffle,
        rightMemberType: rightMemberType,
        minWords: minWords,
        maxWords: maxWords,
        lowerBound: lowerBound,
        upperBound: upperBound,
        threads: threads,
        allowLeadingZeros: allowLeadingZeros,
        crossGridSize: crossGridSize,
      });

      if (response.success && response.cryptarithms.length > 0) {
        // Add all generated cryptarithms to the list
        const newCryptarithms: GeneratedCryptarithm[] = response.cryptarithms.map(crypto => ({
          id: Date.now().toString() + Math.random(),
          equation: crypto.cryptarithm,
          solution: crypto.solution,
          timestamp: new Date(),
        }));

        setGenerated([...newCryptarithms, ...generated]);
        setSelectedCryptarithm(newCryptarithms[0]);

        if (onCryptarithmGenerated && newCryptarithms.length > 0) {
          onCryptarithmGenerated(newCryptarithms[0].equation, {});
        }
      } else {
        setError(response.error || 'Aucun cryptarithme généré');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAll = () => {
    const exportData = {
      cryptarithms: generated.map(c => ({
        equation: c.equation,
        solution: c.solution,
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

  const handleExportSingle = (crypto: GeneratedCryptarithm) => {
    const exportData = {
      equation: crypto.equation,
      solution: crypto.solution,
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
            solution: c.solution || '',
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
    if (selectedCryptarithm && selectedCryptarithm.id === id) {
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
          {isMobile && <BackButtonWithProgress onBack={onBack} />}

          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-[#0096BC] rounded-[12px]">
              <Wand2 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em]">Paramètres de génération</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Operation Type */}
            <div>
              <label className="block text-[14px] font-medium text-[#1D1D1F] mb-3">
                Type d'opération
              </label>
              <div className="space-y-2">
                {[
                  { value: 'addition', label: 'Addition', icon: Plus },
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
                placeholder={"SEND\nMORE\nMONEY"}
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

              {/* Error Message */}
              {error && (
                <div className="mb-3 p-3 bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF3B30] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-[#FF3B30] text-[13px]">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 bg-[#0096BC] text-white rounded-[12px] hover:bg-[#007EA1] transition-all flex items-center justify-center gap-2 mb-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" strokeWidth={1.5} />
                    Générer
                  </>
                )}
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

          {/* Advanced Options Section */}
          <div className="mt-6 border-t border-[#E5E5E5] pt-6">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F7] hover:bg-[#E5E5E5] rounded-[12px] transition-all mb-4"
            >
              <span className="text-[16px] font-semibold text-[#1D1D1F]">
                Options avancées de l'API
              </span>
              <span className="text-[14px] text-[#86868B]">
                {showAdvancedOptions ? '▼' : '▶'}
              </span>
            </button>

            {showAdvancedOptions && (
              <div className="p-4 bg-[#FAFAFA] rounded-[12px]">
                {/* Info sur le symbole d'opération */}
                <div className="mb-6 p-3 bg-[#E8F7FB] border border-[#0096BC]/30 rounded-[12px]">
                  <p className="text-[13px] text-[#1D1D1F]">
                    <strong>Opération sélectionnée :</strong>{' '}
                    {operation === 'addition' ? 'Addition (+)' :
                     operation === 'subtraction' ? 'Soustraction (-)' :
                     operation === 'multiplication' ? 'Multiplication (*)' :
                     operation === 'crossed' ? 'Opération croisée (CROSS)' :
                     operation === 'long-multiplication' ? 'Multiplication longue (LMUL)' : operation}
                  </p>
                  <p className="text-[12px] text-[#86868B] mt-1">
                    Le type d'opération est défini par votre sélection dans les paramètres de base ci-dessus
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Solution Limit */}
                  <div>
                    <NumberInput
                      label="Limite de solutions"
                      value={solutionLimit}
                      onChange={(val) => setSolutionLimit(val ?? 5)}
                      min={1}
                      max={API_LIMITS.maxSolutionsPerRequest}
                    />
                    {solutionLimit > API_LIMITS.maxSolutionsPerRequest && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Maximum {API_LIMITS.maxSolutionsPerRequest} solutions par requête
                      </p>
                    )}
                  </div>

                  {/* Time Limit */}
                  <div>
                    <NumberInput
                      label="Temps limite (secondes)"
                      value={timeLimit}
                      onChange={(val) => setTimeLimit(val ?? 60)}
                      min={1}
                      max={API_LIMITS.maxTimeLimit}
                    />
                    {timeLimit > API_LIMITS.maxTimeLimit && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Maximum {API_LIMITS.maxTimeLimit} secondes par requête
                      </p>
                    )}
                  </div>

                  {/* Right Member Type */}
                  <SelectField
                    label="Type de membre droit"
                    value={rightMemberType}
                    onChange={(val) => setRightMemberType(val as 'UNIQUE' | 'FREE' | 'FIXED')}
                    options={[
                      { value: 'UNIQUE', label: 'UNIQUE (Différent des membres gauches)' },
                      { value: 'FREE', label: 'FREE (Aucune contrainte)' },
                      { value: 'FIXED', label: 'FIXED (Membre droit fixe)' },
                    ]}
                  />

                  {/* Min Words */}
                  <NumberInput
                    label="Mots minimum"
                    value={minWords}
                    onChange={setMinWords}
                    min={1}
                    placeholder="Non défini"
                    allowUndefined={true}
                    helpText="Optionnel"
                  />

                  {/* Max Words */}
                  <NumberInput
                    label="Mots maximum"
                    value={maxWords}
                    onChange={setMaxWords}
                    min={1}
                    placeholder="Non défini"
                    allowUndefined={true}
                    helpText="Optionnel"
                  />

                  {/* Lower Bound */}
                  <NumberInput
                    label="Borne inférieure"
                    value={lowerBound}
                    onChange={setLowerBound}
                    placeholder="Non défini"
                    allowUndefined={true}
                    helpText="Optionnel"
                  />

                  {/* Upper Bound */}
                  <NumberInput
                    label="Borne supérieure"
                    value={upperBound}
                    onChange={setUpperBound}
                    placeholder="Non défini"
                    allowUndefined={true}
                    helpText="Optionnel"
                  />

                  {/* Threads */}
                  <NumberInput
                    label="Threads"
                    value={threads}
                    onChange={(val) => setThreads(val ?? 1)}
                    min={1}
                    max={16}
                  />

                  {/* Cross Grid Size (visible uniquement pour CROSS) */}
                  {operation === 'crossed' && (
                    <NumberInput
                      label="Taille de la grille (CROSS)"
                      value={crossGridSize}
                      onChange={setCrossGridSize}
                      min={2}
                      max={10}
                      placeholder="Non défini"
                      allowUndefined={true}
                      helpText="Taille de la grille pour les opérations croisées"
                    />
                  )}

                  {/* Shuffle */}
                  <CheckboxField
                    id="shuffle"
                    label="Mélanger les mots"
                    checked={shuffle}
                    onChange={setShuffle}
                  />

                  {/* Allow Leading Zeros */}
                  <CheckboxField
                    id="allowLeadingZeros"
                    label="Autoriser les zéros en début de mot"
                    checked={allowLeadingZeros}
                    onChange={setAllowLeadingZeros}
                  />
                </div>
              </div>
            )}
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
                    ${selectedCryptarithm?.id === crypto.id
                      ? 'border-[#0096BC] bg-[#E8F7FB]'
                      : 'border-[#E5E5E5] hover:border-[#0096BC] bg-white'
                    }
                  `}
                  onClick={() => setSelectedCryptarithm(crypto)}
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
                          handleExportSingle(crypto);
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
            <div className="mt-6 space-y-6">
              <div className="p-4 md:p-8 bg-[#F5F5F7] rounded-[12px]">
                <h3 className="text-[18px] md:text-[20px] font-semibold mb-4 md:mb-6 text-center tracking-[-0.01em]">Cryptarithme sélectionné</h3>
                <div className="flex justify-center mb-4 md:mb-6">
                  <div className="bg-white rounded-[12px] p-3 md:p-8 border border-[#E5E5E5]">
                    {(() => {
                      const equation = selectedCryptarithm.equation;
                      const sizeForDisplay = isMobile ? 'medium' : 'large';
                      // Conversion du format API (&&) vers le format du composant (|) pour les opérations croisées
                      if (equation.includes('&&')) {
                        // Format CROSS: "AN + ODE = TUT && TA + TEL = SUT && ..."
                        // Prendre les 3 premières équations et les joindre avec |
                        const equations = equation.split('&&').map(eq => eq.trim());
                        const crossEquation = equations.slice(0, 3).join(' | ');
                        return <CrossedCryptarithm equation={crossEquation} size={sizeForDisplay} />;
                      } else if (equation.includes('|')) {
                        return <CrossedCryptarithm equation={equation} size={sizeForDisplay} />;
                      } else {
                        return <VerticalCryptarithm equation={equation} size={sizeForDisplay} />;
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Affichage de la solution */}
              <div className="p-8 bg-white rounded-[12px] border border-[#E5E5E5]">
                <h3 className="text-[20px] font-semibold mb-6 tracking-[-0.01em]">Solution</h3>
                <SolutionDisplay 
                  solution={selectedCryptarithm.solution} 
                  equation={selectedCryptarithm.equation}
                />
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