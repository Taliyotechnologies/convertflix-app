import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const ConvertVideo: React.FC = () => {
  return (
    <ToolPage
      title="Convert Video"
      description="Convert videos between different formats. Transform MP4 to AVI, MOV to WebM, and more with customizable quality settings."
      actionType="convert"
      supportedFormats={['mp4', 'avi', 'mov', 'wmv', 'flv']}
      maxFileSize="Unlimited"
      toolType="Video"
    />
  );
};

export default ConvertVideo;
