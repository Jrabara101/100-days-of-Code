// Export helpers for submissions and survey analytics
export function exportToCSV(filename, responses, questions) {
  if (!responses || responses.length === 0) {
    alert('No responses available to export.');
    return;
  }

  // Headers: Response ID, Status, Started At, Completed At, Score, Outcome, [Question Titles...]
  const questionHeaders = questions.map(q => `"${(q.title || 'Untitled').replace(/"/g, '""')}"`);
  const headers = ['Response ID', 'Status', 'Started At', 'Completed At', 'Score', 'Calculated Outcome', ...questionHeaders];

  const rows = responses.map(res => {
    const isCompleted = res.is_completed ? 'Completed' : 'Ghost / Abandoned';
    const started = res.started_at ? new Date(res.started_at).toISOString() : '';
    const completed = res.completed_at ? new Date(res.completed_at).toISOString() : 'N/A';
    const score = res.total_score !== undefined ? res.total_score : 'N/A';
    const outcome = res.calculated_outcome_title ? `"${res.calculated_outcome_title.replace(/"/g, '""')}"` : 'N/A';

    const questionValues = questions.map(q => {
      const val = res.answers ? res.answers[q.id] : undefined;
      if (val === undefined || val === null) return '""';
      if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      return `"${String(val).replace(/"/g, '""')}"`;
    });

    return [
      `"${res.id || res.session_token}"`,
      `"${isCompleted}"`,
      `"${started}"`,
      `"${completed}"`,
      `"${score}"`,
      outcome,
      ...questionValues
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'survey-responses'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(filename, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || 'survey-data'}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
