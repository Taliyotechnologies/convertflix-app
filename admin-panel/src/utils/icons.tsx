import { Image, Video, Music, FileText, File } from 'lucide-react';
import type { ReactElement } from 'react';

export function getFileTypeIconComponent(
  type: string,
  opts: { size?: number; className?: string } = {}
): ReactElement {
  const size = opts.size ?? 16;
  const className = opts.className;
  switch (type.toLowerCase()) {
    case 'image':
      return <Image size={size} className={className} />;
    case 'video':
      return <Video size={size} className={className} />;
    case 'audio':
      return <Music size={size} className={className} />;
    case 'pdf':
      return <FileText size={size} className={className} />;
    case 'document':
      return <FileText size={size} className={className} />;
    default:
      return <File size={size} className={className} />;
  }
}
