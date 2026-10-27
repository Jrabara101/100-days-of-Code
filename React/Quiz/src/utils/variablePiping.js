// Replaces {{variable_name}} or {{name}} with collected answers
export function pipeVariables(text, answers = {}, questions = []) {
  if (!text || typeof text !== 'string') return '';

  return text.replace(/\{\{([^{}]+)\}\}/g, (match, rawKey) => {
    const key = rawKey.trim();

    // 1. Direct match on variable_name
    for (const q of questions) {
      if (q.properties?.variable_name && q.properties.variable_name.toLowerCase() === key.toLowerCase()) {
        const val = answers[q.id];
        if (val !== undefined && val !== null && val !== '') {
          return Array.isArray(val) ? val.join(', ') : String(val);
        }
      }
    }

    // 2. Match by question ID or index (e.g. {{q1}} or question title substring)
    const indexMatch = key.match(/^q(\d+)$/i);
    if (indexMatch) {
      const qIndex = parseInt(indexMatch[1], 10) - 1;
      const targetQ = questions[qIndex];
      if (targetQ && answers[targetQ.id]) {
        const val = answers[targetQ.id];
        return Array.isArray(val) ? val.join(', ') : String(val);
      }
    }

    // 3. Match directly in answers keys
    if (answers[key] !== undefined && answers[key] !== null) {
      return Array.isArray(answers[key]) ? answers[key].join(', ') : String(answers[key]);
    }

    // Fallback: If variable not filled yet, return a clean default
    if (key.toLowerCase() === 'name') return 'Friend';
    return match;
  });
}
