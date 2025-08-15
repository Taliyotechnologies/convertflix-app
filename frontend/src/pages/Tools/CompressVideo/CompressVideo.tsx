import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const CompressVideo: React.FC = () => {
  return (
    <ToolPage
      title="Compress Video"
      description="Reduce video file sizes without losing quality. Optimize videos for web streaming, mobile devices, and storage efficiency."
      actionType="compress"
      supportedFormats={['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v']}
      maxFileSize="Unlimited"
      toolType="Video"
    />
  );
};

export default CompressVideo;
