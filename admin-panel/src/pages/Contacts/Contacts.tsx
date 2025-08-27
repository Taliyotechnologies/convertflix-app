import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, CheckCircle, Eye, Mail, X, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './Contacts.module.css';
import { getContacts, updateContactMessage } from '../../services/api';
import type { ContactMessage } from '../../types';

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'new' | 'read' | 'resolved'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const list = await getContacts();
      setContacts(list || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    const id = setInterval(fetchContacts, 20000);
    return () => clearInterval(id);
  }, [fetchContacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (contacts || []).filter((c) => {
      const matchStatus = status === 'all' ? true : (c.status === status);
      if (!q) return matchStatus;
      const hay = `${c.name}\n${c.email}\n${c.subject}\n${c.message}`.toLowerCase();
      return matchStatus && hay.includes(q);
    });
  }, [contacts, search, status]);

  const applyPatchLocal = (id: string, patch: Partial<ContactMessage>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)));
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const markRead = async (c: ContactMessage) => {
    const patch: Partial<ContactMessage> = { status: 'read', read: true } as any;
    applyPatchLocal(c.id, patch);
    try {
      await updateContactMessage(c.id, patch);
    } catch (e) {
      // revert on error
      fetchContacts();
    }
  };

  const markResolved = async (c: ContactMessage) => {
    const patch: Partial<ContactMessage> = { status: 'resolved', resolved: true, read: true } as any;
    applyPatchLocal(c.id, patch);
    try {
      await updateContactMessage(c.id, patch);
    } catch (e) {
      fetchContacts();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.titleIcon}><Mail size={18} /></div>
          <div>
            <div className={styles.title}>Leads</div>
            <div className={styles.subtitle}>Manage contact inquiries</div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btn} onClick={fetchContacts} title="Refresh">
            <RefreshCw size={16} style={{ marginRight: 6 }} /> Refresh
          </button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.input}
              placeholder="Search name, email, subject, message"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading && <div>Loading contacts...</div>}
        {!loading && error && <div style={{ color: 'var(--accent-error)' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={`${styles.row} ${c.status === 'new' ? styles.rowNew : ''}`}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className={styles.meta}>{c.email}</div>
                    </td>
                    <td>
                      <div style={{ marginBottom: 4 }}>{c.subject}</div>
                      <div className={styles.meta}>
                        <span className={`${styles.badge} ${c.status === 'new' ? styles.badgeNew : c.status === 'read' ? styles.badgeRead : styles.badgeResolved}`}>{c.status}</span>
                        {c.updatedAt && <span>updated {formatDate(c.updatedAt)}</span>}
                      </div>
                    </td>
                    <td className={styles.messageCell}>
                      <div className={styles.messageText}>
                        {c.message.length > 180 && !expanded[c.id] ? `${c.message.slice(0, 180)}…` : c.message}
                      </div>
                      {c.message.length > 180 && (
                        <button className={styles.linkBtn} onClick={() => toggleExpand(c.id)}>
                          {expanded[c.id] ? (<><ChevronUp size={12} /> Show less</>) : (<><ChevronDown size={12} /> Show more</>)}
                        </button>
                      )}
                    </td>
                    <td>
                      <div>{formatDate(c.createdAt)}</div>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        {c.status !== 'read' && c.status !== 'resolved' && (
                          <button className={styles.btnGhost} onClick={() => markRead(c)} title="Mark as Read">
                            <Eye size={14} style={{ marginRight: 6 }} /> Read
                          </button>
                        )}
                        {c.status !== 'resolved' && (
                          <button className={styles.btn} onClick={() => markResolved(c)} title="Mark as Resolved">
                            <CheckCircle size={14} style={{ marginRight: 6 }} /> Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--text-muted)', padding: '0.8rem 0.5rem' }}>
                      No contacts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
