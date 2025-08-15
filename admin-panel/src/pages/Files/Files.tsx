import React, { useEffect, useState } from 'react';
import { Search, Calendar, User, Download, Trash2, Eye, ArrowRight } from 'lucide-react';
import { getFiles, deleteFile } from '../../services/api';
import { subscribeSSE, isSSEEnabled } from '../../services/realtime';
import type { FileRecord } from '../../types';
import { formatFileSize, formatDate, getStatusColor } from '../../utils/format';
import { getFileTypeIconComponent } from '../../utils/icons';
import styles from './Files.module.css';

const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);

  // Load initial files
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const f = await getFiles(500).catch(() => []);
        if (!alive) return;
        setFiles(f || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  // Realtime via SSE
  useEffect(() => {
    if (!isSSEEnabled()) return;
    const unsub = subscribeSSE({
      onFileUpsert: (file) => {
        setFiles(prev => {
          const idx = prev.findIndex(x => x.id === file.id);
          if (idx === -1) return [file, ...prev].slice(0, 500);
          const next = [...prev];
          next[idx] = { ...next[idx], ...file };
          return next;
        });
      },
      onFilesReplace: (arr) => setFiles(arr.slice(0, 500)),
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  // Polling fallback when SSE is disabled
  useEffect(() => {
    if (isSSEEnabled()) return;
    const id = setInterval(async () => {
      try {
        const f = await getFiles(500).catch(() => null);
        if (f) setFiles(f);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || file.status === filterStatus;
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDeleteFile = () => {
    if (!selectedFile) return;
    (async () => {
      try {
        await deleteFile(selectedFile.id);
        setFiles(prev => prev.filter(f => f.id !== selectedFile.id));
      } catch (e) {
        // Optionally surface error UI
        console.error('Delete failed', e);
      } finally {
        setShowDeleteModal(false);
        setSelectedFile(null);
      }
    })();
  };

  const handleDownloadFile = (file: any) => {
    // Mock action - in real app, this would trigger a download
    console.log('Downloading file:', file.name);
  };

  const handleViewFile = (file: any) => {
    // Mock action - in real app, this would open a preview
    console.log('Viewing file:', file.name);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Files</h1>
          <p className={styles.subtitle}>Monitor uploaded, compressed, and converted files</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
          <option value="pdf">PDF</option>
          <option value="document">Document</option>
        </select>
      </div>

      {/* Files Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Size</th>
              <th>Status</th>
              <th>Uploaded By</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file) => (
              <tr key={file.id} className={styles.tableRow}>
                <td>
                  <div className={styles.fileCell}>
                    <span className={styles.fileIcon}>{getFileTypeIconComponent(file.type, { size: 16 })}</span>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>{file.name}</span>
                      {file.convertedFormat && (
                        <span className={styles.conversionInfo}>
                          {file.originalFormat} <ArrowRight size={14} /> {file.convertedFormat}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.fileType} ${styles[file.type]}`}>
                    {file.type}
                  </span>
                </td>
                <td>
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  {file.compressionRatio && (
                    <span className={styles.compressionRatio}>
                      {file.compressionRatio}% smaller
                    </span>
                  )}
                </td>
                <td>
                  <span 
                    className={styles.status}
                    style={{ color: getStatusColor(file.status) }}
                  >
                    {file.status}
                  </span>
                </td>
                <td>
                  <div className={styles.userCell}>
                    <User size={16} />
                    {file.uploadedBy}
                  </div>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <Calendar size={16} />
                    {formatDate(file.uploadedAt)}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleViewFile(file)}
                      title="View File"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDownloadFile(file)}
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => {
                        setSelectedFile(file);
                        setShowDeleteModal(true);
                      }}
                      title="Delete File"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFile && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete File</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete "{selectedFile.name}"? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                onClick={handleDeleteFile}
                className={styles.deleteButton}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Files;
