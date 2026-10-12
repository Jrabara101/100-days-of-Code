// Common predictable dictionary words & sequences for client-side leak prevention
const COMMON_LEAK_PATTERNS = [
  'password', '123456', 'qwerty', 'admin', 'welcome', 'login', 'security',
  'letmein', 'monkey', 'football', 'master', 'dragon', 'baseball', 'superman',
  'trustnoone', 'iloveyou', 'starwars', 'access', 'default', 'pass123'
];

export interface EntropyResult {
  score: 0 | 1 | 2 | 3 | 4; // 0 = empty, 1 = weak, 2 = fair, 3 = good, 4 = strong
  label: 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Vault-Grade Passphrase';
  color: string;
  barColorClass: string;
  entropyBits: number;
  crackTimeEstimate: string;
  hasMinLength: boolean;
  hasMixedCase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  hasNoLeakPattern: boolean;
  feedback: string;
  detectedPattern?: string;
}

export function evaluatePasswordEntropy(password: string): EntropyResult {
  if (!password) {
    return {
      score: 0,
      label: 'Empty',
      color: '#64748B',
      barColorClass: 'bg-slate-500',
      entropyBits: 0,
      crackTimeEstimate: 'Instant',
      hasMinLength: false,
      hasMixedCase: false,
      hasNumbers: false,
      hasSymbols: false,
      hasNoLeakPattern: true,
      feedback: 'Enter a strong, memorable passphrase.'
    };
  }

  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasMixedCase = hasLower && hasUpper;
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = length >= 10;

  // Pool size calculation for Shannon entropy
  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 33;

  // Calculate base entropy bits: log2(poolSize^length) = length * log2(poolSize)
  let entropyBits = poolSize > 0 ? Math.round(length * Math.log2(poolSize)) : 0;

  // Dictionary leak pattern check
  const lowerPass = password.toLowerCase();
  let detectedPattern: string | undefined;
  for (const pattern of COMMON_LEAK_PATTERNS) {
    if (lowerPass.includes(pattern)) {
      detectedPattern = pattern;
      entropyBits = Math.max(10, entropyBits - 30);
      break;
    }
  }

  // Sequence detection (e.g., 12345, abcdef)
  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(password)) {
    entropyBits = Math.max(12, entropyBits - 15);
  }

  // Repeated characters detection (e.g., aaaa)
  if (/(.)\1{2,}/.test(password)) {
    entropyBits = Math.max(10, entropyBits - 20);
  }

  const hasNoLeakPattern = !detectedPattern;

  // Determine score (1-4)
  let score: 1 | 2 | 3 | 4 = 1;
  let label: EntropyResult['label'] = 'Weak';
  let color = '#EF4444'; // Red
  let barColorClass = 'bg-red-500';
  let feedback = 'Easily guessed by brute-force dictionaries.';
  let crackTimeEstimate = 'Few seconds';

  if (entropyBits >= 75 && length >= 14 && hasMixedCase && (hasNumbers || hasSymbols)) {
    score = 4;
    label = 'Vault-Grade Passphrase';
    color = '#10B981'; // Emerald
    barColorClass = 'bg-emerald-500';
    feedback = 'Exceptional cryptographic entropy. Immune to online attacks.';
    crackTimeEstimate = 'Centuries';
  } else if (entropyBits >= 52 && length >= 10 && ((hasMixedCase && hasNumbers) || hasSymbols)) {
    score = 3;
    label = 'Good';
    color = '#F59E0B'; // Amber
    barColorClass = 'bg-amber-500';
    feedback = 'Resilient against distributed dictionary attacks.';
    crackTimeEstimate = 'Months to Years';
  } else if (entropyBits >= 35 && length >= 8) {
    score = 2;
    label = 'Fair';
    color = '#F97316'; // Orange
    barColorClass = 'bg-orange-500';
    feedback = 'Moderate strength. Add length or uncommon words.';
    crackTimeEstimate = 'Hours to Days';
  } else {
    score = 1;
    label = 'Weak';
    color = '#EF4444';
    barColorClass = 'bg-red-500';
    if (detectedPattern) {
      feedback = `Contains common dictionary term "${detectedPattern}". Avoid leaked words.`;
    } else {
      feedback = 'Too short or predictable. Use at least 10 characters.';
    }
  }

  return {
    score,
    label,
    color,
    barColorClass,
    entropyBits,
    crackTimeEstimate,
    hasMinLength,
    hasMixedCase,
    hasNumbers,
    hasSymbols,
    hasNoLeakPattern,
    feedback,
    detectedPattern
  };
}
