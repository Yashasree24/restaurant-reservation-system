import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { date: '', timeSlot: '', guests: 2 };

export default function CustomerDashboard() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    const { data } = await api.get('/reservations/mine');
    setReservations(data.reservations);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [slotsRes] = await Promise.all([api.get('/tables/time-slots'), loadReservations()]);
        setTimeSlots(slotsRes.data.timeSlots);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/reservations', {
        date: form.date,
        timeSlot: form.timeSlot,
        guests: Number(form.guests),
      });
      setSuccess('Reservation confirmed!');
      setForm(emptyForm);
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setError('');
    try {
      await api.delete(`/reservations/${id}`);
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel reservation');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="page">
      <h1>Make a Reservation</h1>

      <form className="card form-grid" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <label>
          Date
          <input
            type="date"
            required
            min={today}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
        <label>
          Time Slot
          <select
            required
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
          >
            <option value="">Select a time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>
        <label>
          Guests
          <input
            type="number"
            min={1}
            required
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Booking...' : 'Reserve Table'}
        </button>
      </form>

      <h2>My Reservations</h2>
      {reservations.length === 0 ? (
        <p className="empty-state">You have no reservations yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Table</th>
              <th>Guests</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>{r.date}</td>
                <td>{r.timeSlot}</td>
                <td>#{r.table?.tableNumber} (seats {r.table?.capacity})</td>
                <td>{r.guests}</td>
                <td>
                  <span className={`status status-${r.status}`}>{r.status}</span>
                </td>
                <td>
                  {r.status === 'confirmed' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r._id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
