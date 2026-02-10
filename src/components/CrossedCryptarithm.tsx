interface CrossedCryptarithmProps {
  equation: string;
  size?: 'small' | 'medium' | 'large';
}

export default function CrossedCryptarithm({ equation, size = 'medium' }: CrossedCryptarithmProps) {
  const cellSize = size === 'small' ? 'w-12 h-12 text-lg' : size === 'medium' ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl';
  const gap = size === 'small' ? 'gap-1' : size === 'medium' ? 'gap-2' : 'gap-3';
  const operatorSize = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-xl' : 'text-2xl';

  // Parse equation format: "A + B = C | D + E = F | G + H = I"
  const equations = equation.split('|').map(eq => eq.trim());
  
  if (equations.length !== 3) {
    return <div className="text-red-600">Format invalide pour une grille croisée</div>;
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
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md border-2 border-blue-300`}>
          <span className="text-blue-800">{rows[0].term1}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>+</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md border-2 border-blue-300`}>
          <span className="text-blue-800">{rows[0].term2}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>=</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg shadow-md border-2 border-emerald-300`}>
          <span className="text-emerald-800">{rows[0].result}</span>
        </div>

        {/* Vertical operators row 1 */}
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>+</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>+</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>+</span>
        </div>

        {/* Row 2 */}
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md border-2 border-blue-300`}>
          <span className="text-blue-800">{rows[1].term1}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>+</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md border-2 border-blue-300`}>
          <span className="text-blue-800">{rows[1].term2}</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>=</span>
        </div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg shadow-md border-2 border-emerald-300`}>
          <span className="text-emerald-800">{rows[1].result}</span>
        </div>

        {/* Vertical operators row 2 */}
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>=</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>=</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center text-purple-600`}>
          <span className={operatorSize}>=</span>
        </div>

        {/* Row 3 - Results */}
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg shadow-md border-2 border-emerald-300`}>
          <span className="text-emerald-800">{rows[2].term1}</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg shadow-md border-2 border-emerald-300`}>
          <span className="text-emerald-800">{rows[2].term2}</span>
        </div>
        <div className={`${cellSize}`}></div>
        <div className={`${cellSize} flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-md border-2 border-amber-300`}>
          <span className="text-amber-800">{rows[2].result}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 text-center text-sm text-gray-600 max-w-md mx-auto">
        <p className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <span className="font-semibold">Grille croisée :</span> Chaque ligne et colonne forme une équation valide
        </p>
      </div>
    </div>
  );
}