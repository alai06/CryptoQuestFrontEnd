interface CrossedCryptarithmProps {
  equation: string;
  size?: 'small' | 'medium' | 'large';
}

export default function CrossedCryptarithm({ equation, size = 'medium' }: CrossedCryptarithmProps) {
  const cellSize = size === 'small' ? 'w-12 h-12 text-base' : size === 'medium' ? 'w-16 h-16 text-xl' : 'w-20 h-20 text-2xl';
  const gap = size === 'small' ? 'gap-1' : size === 'medium' ? 'gap-2' : 'gap-3';
  const operatorSize = size === 'small' ? 'text-base' : size === 'medium' ? 'text-lg' : 'text-xl';

  // Parse equation format: "A + B = C | D + E = F | G + H = I" or "A + B = C && D + E = F && G + H = I"
  const equations = equation.split(/\s*(?:\||&&)\s*/);
  
  if (equations.length !== 3) {
    return (
      <div className="p-4 bg-[#FFF5F5] border border-[#FFE5E5] rounded-[12px] text-[#FF3B30] text-[14px]">
        Format invalide pour une grille croisée
      </div>
    );
  }

  const rows = equations.map(eq => {
    const [left, result] = eq.split('=').map(s => s.trim());
    const [term1, term2] = left.split('+').map(s => s.trim());
    return { term1, term2, result };
  });

  // Rendu grille 3x3
  return (
    <div className="inline-block">
      <div className={`grid grid-cols-5 ${gap} font-mono`}>
        {/* Row 1 */}
        <div className={`${cellSize} flex items-center justify-center bg-white rounded-[8px] shadow-sm border border-[#E5E5E5]`}>
          <span className="text-[#1D1D1F] font-semibold">{rows[0].term1}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-white rounded-[8px] shadow-sm border border-[#E5E5E5]`}>
          <span className="text-[#1D1D1F] font-semibold">{rows[0].term2}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-[#E8F7FB] rounded-[8px] shadow-sm border border-[#0096BC]/40`}>
          <span className="text-[#0096BC] font-semibold">{rows[0].result}</span>
        </div>

        {/* Vertical operators row 1 */}
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>

        {/* Row 2 */}
        <div className={`${cellSize} flex items-center justify-center bg-white rounded-[8px] shadow-sm border border-[#E5E5E5]`}>
          <span className="text-[#1D1D1F] font-semibold">{rows[1].term1}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-white rounded-[8px] shadow-sm border border-[#E5E5E5]`}>
          <span className="text-[#1D1D1F] font-semibold">{rows[1].term2}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-[#E8F7FB] rounded-[8px] shadow-sm border border-[#0096BC]/40`}>
          <span className="text-[#0096BC] font-semibold">{rows[1].result}</span>
        </div>

        {/* Vertical operators row 2 */}
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>

        {/* Row 3 - Results */}
        <div className={`${cellSize} flex items-center justify-center bg-[#E8F7FB] rounded-[8px] shadow-sm border border-[#0096BC]/40`}>
          <span className="text-[#0096BC] font-semibold">{rows[2].term1}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>+</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-[#E8F7FB] rounded-[8px] shadow-sm border border-[#0096BC]/40`}>
          <span className="text-[#0096BC] font-semibold">{rows[2].term2}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center`}>
          <span className={`${operatorSize} text-[#86868B] font-medium`}>=</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-[#0096BC] rounded-[8px] shadow-sm border border-[#007EA1]`}>
          <span className="text-white font-bold">{rows[2].result}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 text-center text-[13px] text-[#86868B] max-w-md mx-auto">
        <p className="bg-[#F5F5F7] rounded-[8px] px-4 py-2 border border-[#E5E5E5] inline-block">
          <span className="font-medium text-[#1D1D1F]">Grille croisée :</span> Chaque ligne et colonne forme une équation valide
        </p>
      </div>
    </div>
  );
}