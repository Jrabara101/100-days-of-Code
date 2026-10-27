import React, { useState, useEffect } from 'react';
import HeaderRibbon from './components/HeaderRibbon';
import SurveyStudioLayout from './components/studio/SurveyStudioLayout';
import LogicFlowEditor from './components/logic/LogicFlowEditor';
import ShareAndEmbedSuite from './components/share/ShareAndEmbedSuite';
import AnalyticsDashboard from './components/results/AnalyticsDashboard';
import RespondentRunner from './components/runner/RespondentRunner';
import {
  getSurveys,
  saveSurveys,
  updateSurvey,
  getResponsesForSurvey
} from './utils/storage';
import { sound } from './utils/audio';

export default function App() {
  const [surveys, setSurveys] = useState(() => getSurveys());
  const [activeSurveyId, setActiveSurveyId] = useState(() => {
    const list = getSurveys();
    return list[0]?.id || 'survey-pmf-1';
  });
  const [activeMode, setActiveMode] = useState('build'); // 'build' | 'logic' | 'share' | 'results'
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) || surveys[0];

  // Show temporary toast feedback
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Update survey
  const handleUpdateSurvey = (updated) => {
    const nextList = surveys.map((s) => (s.id === updated.id ? updated : s));
    setSurveys(nextList);
    updateSurvey(updated);
  };

  // Create a new blank survey
  const handleCreateSurvey = () => {
    const newId = 'survey_' + Math.random().toString(36).substr(2, 7);
    const newSurvey = {
      id: newId,
      title: 'Untitled Survey',
      slug: 'survey-' + Math.random().toString(36).substr(2, 6),
      type: 'survey',
      description: 'Collect frictionless feedback with keyboard-first conversational questions.',
      cover_image: null,
      status: 'draft',
      theme_config: {
        primaryColor: '#4F46E5',
        darkTheme: true,
        fontFamily: 'Plus Jakarta Sans',
        showLogo: true,
        logoText: 'PulseFlow'
      },
      settings: {
        shuffle_questions: false,
        time_limit_seconds: null,
        partial_capture: true,
        passing_score: null,
        show_instant_feedback: false,
        auto_advance_delay_ms: 320,
        allow_backtracking: true
      },
      questions: [
        {
          id: 'q_init_1',
          order_index: 1,
          type: 'short_text',
          title: "What's your name?",
          subtitle: 'We will personalize the rest of this experience for you.',
          is_required: true,
          media_url: null,
          properties: {
            placeholder: 'Type your name...',
            variable_name: 'name'
          }
        },
        {
          id: 'q_init_2',
          order_index: 2,
          type: 'multiple_choice',
          title: 'How did you hear about us, {{name}}?',
          subtitle: 'Select one option.',
          is_required: true,
          media_url: null,
          properties: {
            choices: [
              { id: 'c1', label: 'Twitter / X' },
              { id: 'c2', label: 'LinkedIn' },
              { id: 'c3', label: 'Colleague recommendation' }
            ]
          }
        }
      ],
      logic_rules: [],
      quiz_outcomes: [
        {
          id: 'out_init',
          title: 'Thank you for your responses!',
          description: 'Your answers have been recorded.',
          min_score: 0,
          max_score: 100
        }
      ]
    };

    const nextList = [newSurvey, ...surveys];
    setSurveys(nextList);
    saveSurveys(nextList);
    setActiveSurveyId(newId);
    setActiveMode('build');
    showToast('Created new blank survey');
  };

  // Publish changes
  const handlePublish = () => {
    sound.playCorrect();
    const updated = { ...activeSurvey, status: 'published' };
    handleUpdateSurvey(updated);
    showToast('Survey changes published live!');
  };

  // Get active survey responses
  const activeResponses = getResponsesForSurvey(activeSurvey.id);

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col font-sans selection:bg-brand selection:text-white">
      {/* Fullscreen Live Conversational Runner */}
      {isRunnerOpen ? (
        <RespondentRunner
          survey={activeSurvey}
          onClose={() => setIsRunnerOpen(false)}
        />
      ) : (
        <>
          {/* Top Header Ribbon */}
          <HeaderRibbon
            surveys={surveys}
            activeSurvey={activeSurvey}
            onSelectSurvey={(id) => setActiveSurveyId(id)}
            onCreateSurvey={handleCreateSurvey}
            onUpdateSurvey={handleUpdateSurvey}
            activeMode={activeMode}
            onChangeMode={(mode) => setActiveMode(mode)}
            viewportMode={viewportMode}
            onChangeViewport={(vp) => setViewportMode(vp)}
            onLaunchRunner={() => setIsRunnerOpen(true)}
            onPublish={handlePublish}
          />

          {/* Main Body per Active Mode */}
          <main className="flex-1 flex overflow-hidden">
            {activeMode === 'build' && (
              <SurveyStudioLayout
                survey={activeSurvey}
                onUpdateSurvey={handleUpdateSurvey}
                onPreviewQuestion={() => setIsRunnerOpen(true)}
                viewportMode={viewportMode}
              />
            )}

            {activeMode === 'logic' && (
              <LogicFlowEditor
                survey={activeSurvey}
                onUpdateSurvey={handleUpdateSurvey}
              />
            )}

            {activeMode === 'share' && (
              <ShareAndEmbedSuite
                survey={activeSurvey}
                onLaunchRunner={() => setIsRunnerOpen(true)}
              />
            )}

            {activeMode === 'results' && (
              <AnalyticsDashboard
                survey={activeSurvey}
                responses={activeResponses}
              />
            )}
          </main>
        </>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161820] border border-brand/50 text-white text-xs font-semibold shadow-glow-brand animate-fade-slide-up">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
