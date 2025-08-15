import React, { useEffect, useState } from 'react';
import { Search, User as UserIcon, Mail, Calendar, Activity, Plus, Trash2, Key } from 'lucide-react';
import { getUsers, createUser, deleteUser, resetUserPassword } from '../../services/api';
import type { User } from '../../types';
import { formatDate } from '../../utils/format';
import styles from './Users.module.css';

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '' });
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await getUsers({ limit: 100 }).catch(() => []);
        if (!alive) return;
        setUsers(list || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'var(--accent-success)' : 'var(--accent-error)';
  };

  const handleAddUser = () => {
    (async () => {
      try {
        const created = await createUser(newUser);
        setUsers(prev => [created, ...prev]);
        setShowAddModal(false);
        setNewUser({ email: '', password: '', name: '' });
      } catch (e) {
        console.error('Create user failed', e);
      }
    })();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    (async () => {
      try {
        await deleteUser(selectedUser.id);
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      } catch (e) {
        console.error('Delete user failed', e);
      } finally {
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    })();
  };

  const handleResetPassword = (user: User) => {
    (async () => {
      try {
        await resetUserPassword(user.id);
        console.log('Password reset triggered for:', user.email);
      } catch (e) {
        console.error('Reset password failed', e);
      }
    })();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Manage user accounts and permissions</p>
        </div>
        <button 
          className={styles.addButton}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          Grant Access
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={styles.tableRow}>
                <td>
                  <div className={styles.userCell}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className={styles.avatar} />
                    ) : (
                      <div className={styles.avatar} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)' }}>
                        <UserIcon size={16} />
                      </div>
                    )}
                    <span className={styles.userName}>{user.name}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.emailCell}>
                    <Mail size={16} />
                    {user.email}
                  </div>
                </td>
                <td>
                  <span className={`${styles.role} ${styles[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span 
                    className={styles.status}
                    style={{ color: getStatusColor(user.status) }}
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <Calendar size={16} />
                    {formatDate(user.createdAt)}
                  </div>
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <Activity size={16} />
                    {formatDate(user.lastLogin)}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleResetPassword(user)}
                      title="Reset Password"
                    >
                      <Key size={16} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteModal(true);
                      }}
                      title="Delete User"
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Grant Access</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete User</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete {selectedUser.name}? This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser}
                className={styles.deleteButton}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
