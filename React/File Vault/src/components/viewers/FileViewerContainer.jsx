import React from 'react';
import PdfReader from './PdfReader';
import CsvSpreadsheetReader from './CsvSpreadsheetReader';
import ImageReader from './ImageReader';
import TextCodeReader from './TextCodeReader';
import AudioVideoPlayer from './AudioVideoPlayer';

export default function FileViewerContainer({ file }) {
  if (!file) return null;

  const fileName = (file.name || '').toLowerCase();
  const fileType = file.type || '';

  if (fileType === 'pdf' || fileName.endsWith('.pdf')) {
    return <PdfReader file={file} />;
  }

  if (fileType === 'csv' || fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.tsv')) {
    return <CsvSpreadsheetReader file={file} />;
  }

  if (fileType === 'image' || fileName.endsWith('.raw') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    return <ImageReader file={file} />;
  }

  if (fileType === 'video' || fileType === 'audio' || fileName.endsWith('.mov') || fileName.endsWith('.mp4')) {
    return <AudioVideoPlayer file={file} />;
  }

  // Default to Text / Code / Spec reader
  return <TextCodeReader file={file} />;
}

