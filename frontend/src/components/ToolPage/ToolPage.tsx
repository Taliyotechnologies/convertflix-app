import React, { useState, useRef } from 'react';
import styles from './ToolPage.module.css';
import { 
  FileIcon, 
  Upload, 
  X, 
  Download, 
  AlertTriangle, 
  CheckCircle,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  FileText as FileTextIcon,
  Settings,
  Zap
} from 'lucide-react';
import { useSEO } from '../../hooks/useSEO';

interface ToolPageProps {
  title: string;
  description: string;
  actionType: 'compress' | 'convert';
  supportedFormats: string[];
  maxFileSize: string;
  toolType: string;
  inputFormats?: string[]; // New prop for input formats
}

const ToolPage: React.FC<ToolPageProps> = ({
  title,
  description,
  actionType,
  supportedFormats,
  maxFileSize,
  toolType,
  inputFormats
}) => {
  const niceTool = toolType.charAt(0).toUpperCase() + toolType.slice(1);
  const actionLabel = actionType === 'compress' ? 'Compress' : 'Convert';
  useSEO({
    title: `${actionLabel} ${niceTool} Online – ${title} | ConvertFlix`,
    description,
    keywords: [
      'convert flix','flix convert','convertflix','taliyo technologies',
      `${actionLabel.toLowerCase()} ${toolType} online`,
      `${toolType} ${actionType} tool`,
      `${toolType} converter`,`file ${actionType} ${toolType}`
    ],
    path: `/tools/${actionType}-${toolType}`,
  });
  const getDisplayFileName = (name: string, maxLength: number = 48): string => {
    if (!name || name.length <= maxLength) return name;
    const dotIndex = name.lastIndexOf('.');
    const hasExt = dotIndex > 0 && dotIndex < name.length - 1;
    const ext = hasExt ? name.slice(dotIndex) : '';
    const base = hasExt ? name.slice(0, dotIndex) : name;
    const remaining = Math.max(3, maxLength - ext.length - 3);
    const head = Math.max(6, Math.floor(remaining / 2));
    const tail = Math.max(6, remaining - head);
    return `${base.slice(0, head)}...${base.slice(-tail)}${ext}`;
  };
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ 
    originalSize: string; 
    optimizedSize: string; 
    savings: string;
    downloadUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [targetFormat, setTargetFormat] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIconComponent = () => {
    switch (toolType.toLowerCase()) {
      case 'image':
        return <ImageIcon size={24} />;
      case 'video':
        return <VideoIcon size={24} />;
      case 'audio':
        return <MusicIcon size={24} />;
      case 'pdf':
        return <FileTextIcon size={24} />;
      default:
        return <FileIcon size={24} />;
    }
  };

  const getApiEndpoint = () => {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
    const baseUrl = `${apiBase}/tools`;
    switch (actionType) {
      case 'compress':
        return `${baseUrl}/compress-${toolType.toLowerCase()}`;
      case 'convert':
        return `${baseUrl}/convert-${toolType.toLowerCase()}`;
      default:
        return baseUrl;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
      
      // Set default target format for conversion
      if (actionType === 'convert') {
        // Get current file extension
        const currentExt = selectedFile.name.split('.').pop()?.toLowerCase();
        
        // Filter out the current format and set first available format as default
        const availableFormats = supportedFormats.filter(format => 
          format.toLowerCase() !== currentExt && 
          format.toLowerCase() !== 'jpeg' || currentExt !== 'jpg'
        );
        
        if (availableFormats.length > 0) {
          setTargetFormat(availableFormats[0]);
        } else {
          setTargetFormat('');
        }
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setResult(null);
      
      // Set default target format for conversion
      if (actionType === 'convert') {
        // Get current file extension
        const currentExt = droppedFile.name.split('.').pop()?.toLowerCase();
        
        // Filter out the current format and set first available format as default
        const availableFormats = supportedFormats.filter(format => 
          format.toLowerCase() !== currentExt && 
          format.toLowerCase() !== 'jpeg' || currentExt !== 'jpg'
        );
        
        if (availableFormats.length > 0) {
          setTargetFormat(availableFormats[0]);
        } else {
          setTargetFormat('');
        }
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (actionType === 'convert' && !targetFormat) {
      setError('Please select a target format');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (actionType === 'convert') {
        formData.append('targetFormat', targetFormat);
      }

      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProgress(100);
        setResult({
          originalSize: `${(data.originalSize / 1024 / 1024).toFixed(2)} MB`,
          optimizedSize: `${(data.compressedSize / 1024 / 1024).toFixed(2)} MB`,
          savings: `${data.savings || 'N/A'}%`,
          downloadUrl: data.downloadUrl
        });
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.downloadUrl) return;
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';
      const backendBase = apiBase.replace(/\/?api$/, '');
      const response = await fetch(`${backendBase}${result.downloadUrl}`);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create proper filename with correct extension
      let downloadFilename = `processed_${file?.name || 'file'}`;
      if (file) {
        const originalName = file.name;
        const hasDot = originalName.includes('.');
        const baseName = hasDot ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
        if (actionType === 'convert' && targetFormat) {
          downloadFilename = `${baseName}.${targetFormat}`;
        } else if (result.downloadUrl) {
          const dlName = result.downloadUrl.split('/').pop() || '';
          const dlExt = dlName && dlName.includes('.') ? dlName.substring(dlName.lastIndexOf('.') + 1) : '';
          if (dlExt) {
            downloadFilename = `${baseName}.${dlExt}`;
          }
        }
      }
      
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
      setError('Download failed');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.toolPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>{getIconComponent()}</div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.uploadSection}>
            <div
              className={`${styles.dropZone} ${file ? styles.hasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={(inputFormats || supportedFormats).map(format => `.${format}`).join(',')}
                className={styles.fileInput}
              />
              
              {!file ? (
                <div className={styles.uploadPrompt}>
                  <div className={styles.uploadIcon}>
                    <Upload size={48} />
                  </div>
                  <h3>Drop your file here</h3>
                  <p>or</p>
                  <button className={styles.browseButton} onClick={openFileDialog}>
                    Browse Files
                  </button>
                  <p className={styles.fileInfo}>
                    Supported formats: {supportedFormats.join(', ').toUpperCase()}
                  </p>
                  <p className={styles.fileInfo}>Max file size: {maxFileSize}</p>
                </div>
              ) : (
                <div className={styles.fileInfo}>
                  <div className={styles.fileIcon}>
                    <FileIcon size={24} />
                  </div>
                  <div className={styles.fileDetails}>
                    <h4 title={file.name}>{getDisplayFileName(file.name)}</h4>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    className={styles.removeFile}
                    onClick={() => setFile(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Target Format Selection for Conversion */}
            {actionType === 'convert' && file && (
              <div className={styles.formatSelection}>
                <label htmlFor="targetFormat">Convert to:</label>
                <select
                  id="targetFormat"
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className={styles.formatSelect}
                >
                  <option value="">Select format</option>
                  {(() => {
                    const currentExt = file.name.split('.').pop()?.toLowerCase();
                    const availableFormats = supportedFormats.filter(format => {
                      const formatLower = format.toLowerCase();
                      // Don't show current format or jpeg if current is jpg
                      return formatLower !== currentExt && 
                             !(formatLower === 'jpeg' && currentExt === 'jpg') &&
                             !(formatLower === 'jpg' && currentExt === 'jpeg');
                    });
                    
                    return availableFormats.map(format => (
                      <option key={format} value={format}>
                        {format.toUpperCase()}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            )}

            {/* Process Button */}
            <button
              className={`${styles.processButton} ${!file || isProcessing ? styles.disabled : ''}`}
              onClick={handleProcess}
              disabled={!file || isProcessing || (actionType === 'convert' && !targetFormat)}
            >
              {isProcessing ? (
                <>
                  <Settings className={styles.spinning} size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  {actionType === 'compress' ? 'Compress' : 'Convert'} {toolType}
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>{progress}%</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <AlertTriangle size={20} />
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className={styles.results}>
                <h3>Results</h3>
                <div className={styles.resultGrid}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Original Size:</span>
                    <span className={styles.resultValue}>{result.originalSize}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>
                      {actionType === 'compress' ? 'Compressed' : 'Converted'} Size:
                    </span>
                    <span className={styles.resultValue}>{result.optimizedSize}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>
                      {actionType === 'compress' ? 'Space Saved:' : 'Size Change:'}
                    </span>
                    <span className={`${styles.resultValue} ${styles.savings}`}>
                      {actionType === 'compress' ? `-${result.savings}` : result.savings}
                    </span>
                  </div>
                </div>
                <button className={styles.downloadButton} onClick={handleDownload}>
                  <Download size={20} />
                  Download {actionType === 'compress' ? 'Compressed' : 'Converted'} File
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.infoCard}>
              <h3>How it works</h3>
              <ol className={styles.steps}>
                <li>Upload your {toolType} file</li>
                <li>Choose your preferred settings</li>
                <li>Click {actionType === 'compress' ? 'Compress' : 'Convert'} to process</li>
                <li>Download your optimized file</li>
              </ol>
            </div>

            <div className={styles.infoCard}>
                <h3>Supported Formats</h3>
              <div className={styles.formatsList}>
                {supportedFormats.map(format => (
                  <span key={format} className={styles.formatTag}>
                    {format.toUpperCase()}
                  </span>
                ))}
              </div>
                {toolType.toLowerCase() === 'pdf' && (
                  <p className={styles.fileInfo}>
                    Supports standard PDFs (1.3–2.0), image/scanned PDFs, forms (AcroForm/XFA), and embedded fonts.
                  </p>
                )}
            </div>

            <div className={styles.infoCard}>
              <h3>Features</h3>
              <ul className={styles.featuresList}>
                <li><CheckCircle size={16} /> High-quality output</li>
                <li><CheckCircle size={16} /> Fast processing</li>
                <li><CheckCircle size={16} /> Secure & private</li>
                <li><CheckCircle size={16} /> No file size limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolPage;
