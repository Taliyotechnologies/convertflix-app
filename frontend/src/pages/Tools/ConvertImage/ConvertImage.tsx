import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const ConvertImage: React.FC = () => {
  return (
    <ToolPage
      title="Convert Image"
      description="Convert images between different formats. Transform JPG to PNG, PNG to WebP, and more with high quality preservation."
      actionType="convert"
      supportedFormats={['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'ico']}
      maxFileSize="Unlimited"
      toolType="image"
      inputFormats={['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'ico']}
    />
  );
};

export default ConvertImage;
