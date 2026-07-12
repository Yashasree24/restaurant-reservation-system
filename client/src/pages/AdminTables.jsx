import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminTables() {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ tableNumber: '', capacity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    const { data } = await api.get('/tables');
    setTables(data.tables);
  };

  useEffect(() => {
    loadTables()
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tables'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/tables', {
        tableNumber: Number(form.tableNumber),
        capacity: Number(form.capacity),
      });
      setForm({ tableNumber: '', capacity: '' });
      await loadTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add table');
    }
  };

  const toggleActive = async (table) => {
    setError('');
    try {
      await api.patch(`/admin/tables/${table._id}`, { isActive: !table.isActive });
      await loadTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/admin/tables/${id}`);
      await loadTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete table');
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Manage Tables</h1>
        <Link to="/admin" className="btn btn-secondary">
          Back to Reservations
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-row" onSubmit={handleAdd}>
        <label>
          Table Number
          <input
            type="number"
            min={1}
            required
            value={form.tableNumber}
            onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
          />
        </label>
        <label>
          Capacity
          <input
            type="number"
            min={1}
            required
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Add Table
        </button>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Table #</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((t) => (
            <tr key={t._id}>
              <td>#{t.tableNumber}</td>
              <td>{t.capacity}</td>
              <td>
                <span className={`status status-${t.isActive ? 'confirmed' : 'cancelled'}`}>
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="actions-cell">
                <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(t)}>
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
