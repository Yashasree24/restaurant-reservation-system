import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AdminDashboard() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadReservations = async (filters = {}) => {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.status) params.status = filters.status;
    const { data } = await api.get('/admin/reservations', { params });
    setReservations(data.reservations);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [tablesRes, slotsRes] = await Promise.all([
          api.get('/tables'),
          api.get('/tables/time-slots'),
        ]);
        setTables(tablesRes.data.tables);
        setTimeSlots(slotsRes.data.timeSlots);
        await loadReservations();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleFilter = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await loadReservations({ date: dateFilter, status: statusFilter });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to filter reservations');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await api.delete(`/admin/reservations/${id}`);
      await loadReservations({ date: dateFilter, status: statusFilter });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel reservation');
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setEditForm({
      date: r.date,
      timeSlot: r.timeSlot,
      guests: r.guests,
      tableId: r.table?._id,
      status: r.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      await api.patch(`/admin/reservations/${id}`, {
        date: editForm.date,
        timeSlot: editForm.timeSlot,
        guests: Number(editForm.guests),
        tableId: editForm.tableId,
        status: editForm.status,
      });
      cancelEdit();
      await loadReservations({ date: dateFilter, status: statusFilter });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update reservation');
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>All Reservations</h1>
        <Link to="/admin/tables" className="btn btn-secondary">
          Manage Tables
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="filter-bar" onSubmit={handleFilter}>
        <label>
          Date
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit">
          Apply Filter
        </button>
      </form>

      {reservations.length === 0 ? (
        <p className="empty-state">No reservations found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Table</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) =>
              editingId === r._id ? (
                <tr key={r._id} className="editing-row">
                  <td>{r.user?.name}</td>
                  <td>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={editForm.timeSlot}
                      onChange={(e) => setEditForm({ ...editForm, timeSlot: e.target.value })}
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={editForm.tableId}
                      onChange={(e) => setEditForm({ ...editForm, tableId: e.target.value })}
                    >
                      {tables.map((t) => (
                        <option key={t._id} value={t._id}>
                          #{t.tableNumber} (seats {t.capacity})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={editForm.guests}
                      onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(r._id)}>
                      Save
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r._id}>
                  <td>
                    {r.user?.name}
                    <div className="subtext">{r.user?.email}</div>
                  </td>
                  <td>{r.date}</td>
                  <td>{r.timeSlot}</td>
                  <td>#{r.table?.tableNumber} (seats {r.table?.capacity})</td>
                  <td>{r.guests}</td>
                  <td>
                    <span className={`status status-${r.status}`}>{r.status}</span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    {r.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(r._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
