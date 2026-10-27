import React, { useState } from 'react';
import QuestionOutlineRail from './QuestionOutlineRail';
import CanvasEditor from './CanvasEditor';
import BlockInspector from './BlockInspector';
import AddQuestionModal from './AddQuestionModal';

export default function SurveyStudioLayout({
  survey,
  onUpdateSurvey,
  onPreviewQuestion,
  viewportMode = 'desktop'
}) {
  const [activeQuestionId, setActiveQuestionId] = useState(
    survey.questions[0]?.id || null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeQuestion =
    survey.questions.find((q) => q.id === activeQuestionId) || survey.questions[0];

  // Update a single question block
  const handleUpdateQuestion = (updatedQuestion) => {
    const updatedQuestions = survey.questions.map((q) =>
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    onUpdateSurvey({ ...survey, questions: updatedQuestions });
  };

  // Add a new question of specified type
  const handleAddQuestionType = (type) => {
    const newId = 'q_' + Math.random().toString(36).substr(2, 7);
    const newOrderIndex = survey.questions.length + 1;

    let defaultProperties = {
      placeholder: 'Type your answer here...',
      variable_name: ''
    };

    if (type === 'multiple_choice') {
      defaultProperties = {
        choices: [
          { id: 'c1', label: 'Option 1' },
          { id: 'c2', label: 'Option 2' },
          { id: 'c3', label: 'Option 3' }
        ],
        correct_answer: null,
        points: 25
      };
    } else if (type === 'picture_choice') {
      defaultProperties = {
        choices: [
          { id: 'p1', label: 'Option A', image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&auto=format&fit=crop&q=80' },
          { id: 'p2', label: 'Option B', image_url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&auto=format&fit=crop&q=80' }
        ]
      };
    } else if (type === 'opinion_scale') {
      defaultProperties = {
        min_value: 0,
        max_value: 10,
        min_label: 'Not likely',
        max_label: 'Extremely likely'
      };
    } else if (type === 'rating') {
      defaultProperties = {
        max_value: 5
      };
    }

    const newQuestion = {
      id: newId,
      order_index: newOrderIndex,
      type: type,
      title: 'Untitled Question',
      subtitle: '',
      is_required: false,
      media_url: null,
      properties: defaultProperties
    };

    const updatedQuestions = [...survey.questions, newQuestion];
    onUpdateSurvey({ ...survey, questions: updatedQuestions });
    setActiveQuestionId(newId);
  };

  // Reorder questions
  const handleReorderQuestion = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= survey.questions.length) return;
    const reordered = [...survey.questions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // Update order indexes
    const updatedWithOrder = reordered.map((q, idx) => ({
      ...q,
      order_index: idx + 1
    }));

    onUpdateSurvey({ ...survey, questions: updatedWithOrder });
  };

  // Duplicate question
  const handleDuplicateQuestion = (id) => {
    const target = survey.questions.find((q) => q.id === id);
    if (!target) return;

    const newId = 'q_' + Math.random().toString(36).substr(2, 7);
    const duplicated = {
      ...target,
      id: newId,
      title: `${target.title} (Copy)`,
      order_index: survey.questions.length + 1
    };

    onUpdateSurvey({ ...survey, questions: [...survey.questions, duplicated] });
    setActiveQuestionId(newId);
  };

  // Delete question
  const handleDeleteQuestion = (id) => {
    if (survey.questions.length <= 1) return;
    const updated = survey.questions.filter((q) => q.id !== id);
    onUpdateSurvey({ ...survey, questions: updated });
    if (activeQuestionId === id) {
      setActiveQuestionId(updated[0]?.id || null);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-65px)]">
      {/* 1. Left Rail: Question Outline */}
      <QuestionOutlineRail
        questions={survey.questions}
        activeQuestionId={activeQuestion?.id}
        onSelectQuestion={(id) => setActiveQuestionId(id)}
        onAddClick={() => setIsAddModalOpen(true)}
        onReorderQuestion={handleReorderQuestion}
        onDuplicateQuestion={handleDuplicateQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        logicRules={survey.logic_rules || []}
        isQuiz={survey.type === 'scored_quiz'}
      />

      {/* 2. Center Canvas: Visual Question Editor */}
      <CanvasEditor
        question={activeQuestion}
        onUpdateQuestion={handleUpdateQuestion}
        surveyQuestions={survey.questions}
        onPreviewQuestion={onPreviewQuestion}
        isQuiz={survey.type === 'scored_quiz'}
        viewportMode={viewportMode}
      />

      {/* 3. Right Rail: Block Settings Inspector */}
      <BlockInspector
        question={activeQuestion}
        onUpdateQuestion={handleUpdateQuestion}
        isQuiz={survey.type === 'scored_quiz'}
      />

      {/* Polymorphic Question Type Picker Modal */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectType={handleAddQuestionType}
      />
    </div>
  );
}
