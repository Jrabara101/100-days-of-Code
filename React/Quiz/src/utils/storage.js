import { initialSurveys, initialResponses } from '../data/mockData';

const STORAGE_KEYS = {
  SURVEYS: 'pulseflow_surveys_v1',
  RESPONSES: 'pulseflow_responses_v1',
  ACTIVE_SURVEY_ID: 'pulseflow_active_survey_id_v1',
  WEBHOOKS: 'pulseflow_webhooks_v1'
};

// Initialize default storage if empty
export function initStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.SURVEYS)) {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(initialSurveys));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESPONSES)) {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(initialResponses));
  }
}

// Surveys Management
export function getSurveys() {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SURVEYS);
    return raw ? JSON.parse(raw) : initialSurveys;
  } catch {
    return initialSurveys;
  }
}

export function saveSurveys(surveys) {
  try {
    localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
  } catch (err) {
    console.error('Error saving surveys to localStorage', err);
  }
}

export function getSurveyById(id) {
  const surveys = getSurveys();
  return surveys.find(s => s.id === id) || surveys[0];
}

export function updateSurvey(updatedSurvey) {
  const surveys = getSurveys();
  const index = surveys.findIndex(s => s.id === updatedSurvey.id);
  if (index >= 0) {
    surveys[index] = { ...updatedSurvey, updated_at: new Date().toISOString() };
  } else {
    surveys.push(updatedSurvey);
  }
  saveSurveys(surveys);
  return updatedSurvey;
}

// Responses & Ghost Partial Capture Management
export function getResponses() {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESPONSES);
    return raw ? JSON.parse(raw) : initialResponses;
  } catch {
    return initialResponses;
  }
}

export function saveResponses(responses) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(responses));
  } catch (err) {
    console.error('Error saving responses', err);
  }
}

export function getResponsesForSurvey(surveyId) {
  const all = getResponses();
  return all.filter(r => r.survey_id === surveyId);
}

// Real-time Partial (Ghost) Answer Upsert
export function upsertPartialAnswer({
  surveyId,
  sessionToken,
  questionId,
  answerValue,
  device = 'desktop',
  scoreAwarded = 0
}) {
  const all = getResponses();
  let existing = all.find(r => r.session_token === sessionToken);

  if (!existing) {
    existing = {
      id: 'res-' + Math.random().toString(36).substr(2, 9),
      survey_id: surveyId,
      session_token: sessionToken,
      is_completed: false,
      last_question_id: questionId,
      total_score: scoreAwarded,
      calculated_outcome_title: null,
      device: device,
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_seconds: 0,
      answers: {}
    };
    all.push(existing);
  }

  // Update answer and checkpoint
  existing.answers = existing.answers || {};
  existing.answers[questionId] = answerValue;
  existing.last_question_id = questionId;

  saveResponses(all);
  return existing;
}

// Finalize and Complete Response
export function completeResponse({
  sessionToken,
  totalScore = 0,
  outcomeTitle = null,
  durationSeconds = 0
}) {
  const all = getResponses();
  const existing = all.find(r => r.session_token === sessionToken);

  if (existing) {
    existing.is_completed = true;
    existing.completed_at = new Date().toISOString();
    existing.total_score = totalScore;
    existing.calculated_outcome_title = outcomeTitle;
    existing.duration_seconds = durationSeconds;
    saveResponses(all);
    return existing;
  }
  return null;
}

// Webhooks
export function getWebhooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEBHOOKS);
    return raw ? JSON.parse(raw) : [
      { id: 'wh-1', name: 'Slack Alerts Channel', url: 'https://hooks.slack.com/services/DEMO/T001/PULSE', event: 'response.completed', active: true },
      { id: 'wh-2', name: 'CRM Ghost Lead Ingestion', url: 'https://api.acme-crm.com/v1/ghost-leads', event: 'response.partial', active: true }
    ];
  } catch {
    return [];
  }
}

export function saveWebhooks(hooks) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEBHOOKS, JSON.stringify(hooks));
  } catch (err) {
    console.error(err);
  }
}
