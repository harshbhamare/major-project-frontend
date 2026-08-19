import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const emptyForm = { name: '', email: '', password: '', role: 'student' };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api.get('/admin/users').then(({ data }) => { setUsers(data); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/admin/users/${editId}`, form);
      } else {
        await api.post('/admin/users', form);
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setEditId(user._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    fetchUsers();
  };

  const toggleActive = async (user) => {
    await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
    fetchUsers();
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}>
          + Add User
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="card-title" style={{ marginBottom: '1rem' }}>{editId ? 'Edit User' : 'New User'}</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password {editId && '(leave blank to keep)'}</label>
                <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-1">
              <button type="submit" className="btn btn-primary">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'warning' : 'success'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.isActive ? 'success' : 'danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(u)}>Edit</button>
                      <button className="btn btn-sm btn-warning" onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
