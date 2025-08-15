import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const CompressImage: React.FC = () => {
  return (
    <ToolPage
      title="Compress Image"
      description="Reduce image file sizes while maintaining quality. Perfect for web optimization, email attachments, and storage savings."
      actionType="compress"
      supportedFormats={['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'ico']}
      maxFileSize="Unlimited"
      toolType="image"
    />
  );
};

export default CompressImage;
                        