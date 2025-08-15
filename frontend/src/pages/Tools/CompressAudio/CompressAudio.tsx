import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const CompressAudio: React.FC = () => {
  return (
    <ToolPage
      title="Compress Audio"
      description="Reduce audio file sizes while maintaining sound quality. Optimize music files, podcasts, and voice recordings."
      actionType="compress"
      supportedFormats={['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a']}
      maxFileSize="Unlimited"
      toolType="Audio"
    />
  );
};

export default CompressAudio;
