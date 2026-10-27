import React from 'react';
import ShortTextBlock from './blocks/ShortTextBlock';
import LongTextBlock from './blocks/LongTextBlock';
import MultipleChoiceBlock from './blocks/MultipleChoiceBlock';
import PictureChoiceBlock from './blocks/PictureChoiceBlock';
import OpinionScaleBlock from './blocks/OpinionScaleBlock';
import RatingBlock from './blocks/RatingBlock';
import DatePickerBlock from './blocks/DatePickerBlock';
import FileUploadBlock from './blocks/FileUploadBlock';

export default function QuestionBlockFactory({
  question,
  value,
  onChange,
  onSubmit,
  isQuiz = false,
  showFeedback = false,
  disabled = false
}) {
  if (!question) return null;

  switch (question.type) {
    case 'short_text':
    case 'email':
    case 'phone':
      return (
        <ShortTextBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'long_text':
      return (
        <LongTextBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'multiple_choice':
      return (
        <MultipleChoiceBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          isQuiz={isQuiz}
          showFeedback={showFeedback}
          disabled={disabled}
        />
      );

    case 'picture_choice':
      return (
        <PictureChoiceBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'opinion_scale':
      return (
        <OpinionScaleBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'rating':
      return (
        <RatingBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'date_picker':
      return (
        <DatePickerBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    case 'file_upload':
      return (
        <FileUploadBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );

    default:
      return (
        <ShortTextBlock
          question={question}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          disabled={disabled}
        />
      );
  }
}
