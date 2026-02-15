import { CheckCircle2, Info } from 'lucide-react';

interface SolutionDisplayProps {
  solution: string;
  equation: string;
}

/**
 * Composant pour afficher la solution d'un cryptarithme généré
 * Parse et affiche les assignments de manière lisible
 */
export default function SolutionDisplay({ solution, equation }: SolutionDisplayProps) {
  // Parser la solution (format: "A=1, B=2, C=3" ou format tableau pour CROSS)
  const parseSolution = (): Record<string, string> => {
    const assignments: Record<string, string> = {};
    
    if (!solution || solution.trim() === '') {
      return assignments;
    }

    // Format 4: Format tableau pour opérations croisées (CROSS)
    // " A| D| E| L| N| O| S| T| U|\n 8| 1| 6| 5| 7| 2| 4| 3| 0|"
    if (solution.includes('\n') && solution.includes('|')) {
      const lines = solution.trim().split('\n');
      if (lines.length >= 2) {
        const letters = lines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        const values = lines[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
        
        if (letters.length === values.length) {
          letters.forEach((letter, index) => {
            if (letter && values[index]) {
              assignments[letter] = values[index];
            }
          });
          return assignments;
        }
      }
    }

    // Essayer de parser différents formats standards
    // Format 1: "A=1, B=2, C=3"
    // Format 2: "{A=1, B=2, C=3}"
    // Format 3: "[A=1][B=2][C=3]"
    
    const cleanSolution = solution.replace(/[{}[\]]/g, '').trim();
    const pairs = cleanSolution.split(/[,;]\s*/);
    
    pairs.forEach(pair => {
      const match = pair.match(/([A-Z])=(\d+)/);
      if (match) {
        const [, letter, value] = match;
        assignments[letter] = value;
      }
    });
    
    return assignments;
  };

  // Évaluer l'équation avec les assignments
  const evaluateWithAssignments = (assignments: Record<string, string>): string => {
    let evaluated = equation;
    
    // Remplacer chaque lettre par sa valeur
    Object.keys(assignments)
      .sort((a, b) => b.length - a.length) // Trier par longueur décroissante pour éviter les problèmes de remplacement
      .forEach(letter => {
        const value = assignments[letter];
        evaluated = evaluated.replace(new RegExp(letter, 'g'), value);
      });
    
    return evaluated;
  };

  const assignments = parseSolution();
  const letterCount = Object.keys(assignments).length;

  if (letterCount === 0) {
    return (
      <div className="bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#FF9500] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-[14px] text-[#1D1D1F] font-medium">Solution non disponible</p>
            <p className="text-[12px] text-[#86868B] mt-1">
              Aucune solution n'a été renvoyée par l'API pour ce cryptarithme.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const evaluatedEquation = evaluateWithAssignments(assignments);

  return (
    <div className="space-y-3">
      {/* En-tête avec résumé */}
      <div className="bg-gradient-to-r from-[#E8F7FB] to-[#E8F4F8] border border-[#0096BC]/30 rounded-[12px] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#34C759]" strokeWidth={2} />
            <h4 className="text-[14px] font-semibold text-[#1D1D1F]">Solution trouvée</h4>
          </div>
          <p className="text-[13px] text-[#86868B]">
            {letterCount} lettre{letterCount > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Assignments des lettres */}
      <div>
        <h5 className="text-[14px] font-semibold text-[#1D1D1F] mb-2">Assignments</h5>
        <div className="flex flex-wrap gap-2">
          {Object.entries(assignments)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, value]) => (
              <div
                key={letter}
                className="inline-flex items-center gap-2 bg-white border-2 border-[#0096BC] rounded-[12px] px-3 py-1.5 hover:shadow-md transition-shadow"
              >
                <span className="text-[16px] font-bold text-[#0096BC]">{letter}</span>
                <span className="text-[13px] text-[#86868B] font-medium">=</span>
                <span className="text-[16px] font-bold text-[#1D1D1F]">{value}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Équation évaluée */}
      <div>
        <h5 className="text-[14px] font-semibold text-[#1D1D1F] mb-2">Vérification</h5>
        <div className="bg-[#F5F5F7] border border-[#E5E5E5] rounded-[12px] p-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#86868B] font-medium min-w-[70px]">Équation:</span>
              <span className="text-[14px] font-mono text-[#1D1D1F] font-semibold">{equation}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#86868B] font-medium min-w-[70px]">Valeurs:</span>
              <span className="text-[14px] font-mono text-[#0096BC] font-semibold">{evaluatedEquation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Données brutes (pour debug) */}
      <details className="bg-[#F5F5F7] border border-[#E5E5E5] rounded-[12px] p-3">
        <summary className="text-[11px] text-[#86868B] cursor-pointer hover:text-[#1D1D1F] transition-colors font-medium">
          Données brutes de la solution
        </summary>
        <pre className="text-[10px] text-[#86868B] mt-2 p-2 bg-white rounded-[8px] border border-[#E5E5E5] overflow-x-auto">
          {solution}
        </pre>
      </details>
    </div>
  );
}
