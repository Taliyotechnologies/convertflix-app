import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const CompressPDF: React.FC = () => {
  return (
    <ToolPage
      title="Compress PDF"
      description="Reduce PDF file sizes while preserving readability. Supports all standard PDF versions (1.3–2.0), image‑heavy/scanned PDFs, forms, and embedded fonts."
      actionType="compress"
      supportedFormats={['pdf']}
      maxFileSize="Unlimited"
      toolType="PDF"
    />
  );
};

export default CompressPDF;
