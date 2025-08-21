import React, { useEffect, useMemo, useState } from 'react';
import { Search, Mail as MailIcon, Calendar, Eye, Check, CheckCircle } from 'lucide-react';
import { getContacts, updateContact } from '../../services/api';
import { subscribeSSE } from '../../services/realtime';
import type { ContactMessage } from '../../types';
import { formatDate } from '../../utils/format';
// Reuse Users page styles for consistent layout and modals
import styles from '../Users/Users.module.css';

const Contacts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'resolved'>('all');
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getContacts({ limit: 200 }).catch(() => []);
        if (!alive) return;
        setContacts(list || []);
      } catch {}
    })();
    const unsub = subscribeSSE({
      onContactsReplace: (list) => {
        setContacts(Array.isArray(list) ? list : []);
      },
      onContactUpsert: (c) => {
        setContacts(prev => {
          const idx = prev.findIndex(x => x.id === c.id);
          if (idx >= 0) {
            const copy = prev.slice();
            copy[idx] = { ...prev[idx], ...c } as ContactMessage;
            return copy;
          }
          return [c, ...prev];
        });
      }
    });
    return () => { alive = false; try { unsub(); } catch {} };
  }, []);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchesStatus = filterStatus === 'all' || (c.status === filterStatus);
      const t = searchTerm.trim().toLowerCase();
      const matchesSearch = !t || [c.name, c.email, c.subject, c.message].some(v => (v || '').toLowerCase().includes(t));
      return matchesStatus && matchesSearch;
    });
  }, [contacts, filterStatus, searchTerm]);

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'var(--accent-warning)';
      case 'resolved': return 'var(--accent-success)';
      case 'read': default: return 'var(--text-muted)';
    }
  };

  const openEdit = (c: ContactMessage) => {
    setSelected(c);
    setEditSubject(c.subject);
    setEditMessage(c.message);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!selected) return;
    (async () => {
      try {
        const updated = await updateContact(selected.id, { subject: editSubject, message: editMessage });
        setContacts(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      } catch (e) {
        console.error('Update contact failed', e);
      } finally {
        setShowEditModal(false);
        setSelected(null);
      }
    })();
  };

  const markRead = (c: ContactMessage) => {
    if (c.status === 'read') return;
    (async () => {
      try {
        const updated = await updateContact(c.id, { status: 'read', read: true });
        setContacts(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      } catch (e) {
        console.error('Mark read failed', e);
      }
    })();
  };

  const markResolved = (c: ContactMessage) => {
    if (c.status === 'resolved') return;
    (async () => {
      try {
        const updated = await updateContact(c.id, { status: 'resolved', resolved: true });
        setContacts(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      } catch (e) {
        console.error('Mark resolved failed', e);
      }
    })();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Contacts</h1>
          <p className={styles.subtitle}>View and manage contact messages from the public site</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className={styles.filterSelect}
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>From</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Received</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className={styles.tableRow}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                      <MailIcon size={16} />
                    </div>
                    <span className={styles.userName}>{c.name}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.emailCell}>
                    <MailIcon size={16} />
                    {c.email}
                  </div>
                </td>
                <td>
                  <span className={styles.role}>{c.subject}</span>
                </td>
                <td>
                  <span 
                    className={styles.status}
                    style={{ color: getContactStatusColor(c.status) }}
                  >
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <Calendar size={16} />
                    {formatDate(c.createdAt)}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => openEdit(c)}
                      title="View / Edit"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => markRead(c)}
                      title="Mark Read"
                      disabled={c.status !== 'new'}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => markResolved(c)}
                      title="Mark Resolved"
                      disabled={c.status === 'resolved'}
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && selected && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Contact from {selected.name}</h3>
            <div className={styles.formGroup}>
              <label>Subject</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Message</label>
              <textarea
                rows={6}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowEditModal(false)}>
                Close
              </button>
              <button className={styles.primaryButton} onClick={saveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
