interface VerticalCryptarithmProps {
  equation: string;
  size?: 'small' | 'medium' | 'large';
}

export default function VerticalCryptarithm({ equation, size = 'medium' }: VerticalCryptarithmProps) {
  const fontSize = size === 'small' ? 'text-lg' : size === 'medium' ? 'text-2xl' : 'text-4xl';
  const spacing = size === 'small' ? 'gap-1' : size === 'medium' ? 'gap-2' : 'gap-3';
  const lineWidth = size === 'small' ? 'w-32' : size === 'medium' ? 'w-48' : 'w-64';

  // Parse equation to detect type and components
  const parseEquation = () => {
    // Check for long multiplication format (contains |)
    if (equation.includes('|')) {
      const [mainPart, partialsPart] = equation.split('|');
      const [left, right] = mainPart.split('=');
      const [multiplicand, multiplier] = left.split('×').map(s => s.trim());
      const [partialsSum, result] = partialsPart.split('=').map(s => s.trim());
      const partials = partialsSum.split('+').map(s => s.trim());
      
      return {
        type: 'long-multiplication',
        multiplicand,
        multiplier,
        partials,
        result
      };
    }

    // Standard equation format
    const [left, result] = equation.split('=').map(s => s.trim());
    
    // Accept both × and * for multiplication
    if (left.includes('×') || left.includes('*')) {
      const terms = left.split(/[×*]/).map(s => s.trim());
      return {
        type: 'multiplication',
        terms,
        result
      };
    } else if (left.includes('+')) {
      const terms = left.split('+').map(s => s.trim());
      return {
        type: 'addition',
        terms,
        result
      };
    } else if (left.includes('-')) {
      const terms = left.split('-').map(s => s.trim());
      return {
        type: 'subtraction',
        terms,
        result
      };
    }

    return { type: 'unknown', terms: [left], result };
  };

  const parsed = parseEquation();

  // Render addition
  if (parsed.type === 'addition') {
    return (
      <div className={`flex flex-col items-end ${spacing} font-mono ${fontSize}`}>
        {parsed.terms?.map((term, index) => (
          <div key={index} className="flex items-center gap-3">
            {index > 0 && <span className="text-purple-600">+</span>}
            <span className="tracking-wider">{term}</span>
          </div>
        ))}
        <div className={`border-t-2 border-gray-800 ${lineWidth}`}></div>
        <span className="tracking-wider">{parsed.result}</span>
      </div>
    );
  }

  // Render subtraction
  if (parsed.type === 'subtraction') {
    return (
      <div className={`flex flex-col items-end ${spacing} font-mono ${fontSize}`}>
        {parsed.terms?.map((term, index) => (
          <div key={index} className="flex items-center gap-3">
            {index > 0 && <span className="text-purple-600">-</span>}
            <span className="tracking-wider">{term}</span>
          </div>
        ))}
        <div className={`border-t-2 border-gray-800 ${lineWidth}`}></div>
        <span className="tracking-wider">{parsed.result}</span>
      </div>
    );
  }

  // Render simple multiplication
  if (parsed.type === 'multiplication') {
    return (
      <div className={`flex flex-col items-end ${spacing} font-mono ${fontSize}`}>
        <span className="tracking-wider">{parsed.terms?.[0]}</span>
        <div className="flex items-center gap-3">
          <span className="text-purple-600">×</span>
          <span className="tracking-wider">{parsed.terms?.[1]}</span>
        </div>
        <div className={`border-t-2 border-gray-800 ${lineWidth}`}></div>
        <span className="tracking-wider">{parsed.result}</span>
      </div>
    );
  }

  // Render long multiplication with partial products
  if (parsed.type === 'long-multiplication') {
    const maxLength = Math.max(
      parsed.multiplicand?.length || 0,
      parsed.multiplier?.length || 0,
      ...(parsed.partials?.map(p => p.length) || []),
      parsed.result?.length || 0
    );

    return (
      <div className={`flex flex-col items-center ${spacing} font-mono ${fontSize}`}>
        {/* Multiplicand */}
        <div className="w-full flex justify-end">
          <span className="tracking-wider">{parsed.multiplicand}</span>
        </div>
        
        {/* Multiplier */}
        <div className="w-full flex justify-end items-center gap-3">
          <span className="text-purple-600">×</span>
          <span className="tracking-wider">{parsed.multiplier}</span>
        </div>

        {/* First line */}
        <div className={`border-t-2 border-gray-800 ${lineWidth}`}></div>

        {/* Partial products */}
        {parsed.partials?.map((partial, index) => (
          <div key={index} className="w-full flex justify-end">
            <span 
              className="tracking-wider text-emerald-600" 
              style={{ paddingRight: `${index * 1.5}ch` }}
            >
              {partial}
            </span>
          </div>
        ))}

        {/* Second line */}
        <div className={`border-t-2 border-gray-800 ${lineWidth}`}></div>

        {/* Final result */}
        <div className="w-full flex justify-end">
          <span className="tracking-wider">{parsed.result}</span>
        </div>
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div className={`font-mono ${fontSize} tracking-wider text-center`}>
      {equation}
    </div>
  );
}
