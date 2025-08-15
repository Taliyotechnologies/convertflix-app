import React from 'react';
import ToolPage from '../../../components/ToolPage/ToolPage';

const ConvertAudio: React.FC = () => {
  return (
    <ToolPage
      title="Convert Audio"
      description="Convert audio files between different formats. Transform MP3 to WAV, FLAC to AAC, and more with customizable bitrate settings."
      actionType="convert"
      supportedFormats={['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus']}
      maxFileSize="Unlimited"
      toolType="Audio"
    />
  );
};

export default ConvertAudio;
