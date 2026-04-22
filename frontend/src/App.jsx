import { useState, useEffect, useCallback } from 'react';
import SwitchTable from './components/SwitchTable.jsx';

const API = '/api';

export default function App() {
  const [records, setRecords]         = useState([]);
  const [switches, setSwitches]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [form, setForm]               = useState({ hostname: '', ip_address: '', payload: '{}' });
  const [submitMsg, setSubmitMsg]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataRes, swRes] = await Promise.all([
        fetch(`${API}/get_data`),
        fetch(`${API}/switches`),
      ]);
      if (!dataRes.ok || !swRes.ok) throw new Error('API request failed');
      const [data, sw] = await Promise.all([dataRes.json(), swRes.json()]);
      setRecords(data);
      setSwitches(sw);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 10_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg(null);
    let extra;
    try {
      extra = JSON.parse(form.payload);
    } catch {
      setSubmitMsg({ ok: false, text: 'Invalid JSON in payload field' });
      return;
    }
    const body = { ...extra };
    if (form.hostname)   body.hostname   = form.hostname;
    if (form.ip_address) body.ip_address = form.ip_address;

    try {
      const res = await fetch(`${API}/update_switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitMsg({ ok: true, text: 'Submitted successfully' });
      fetchData();
    } catch (err) {
      setSubmitMsg({ ok: false, text: err.message });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '1px solid #21262d', paddingBottom: '12px', marginBottom: '20px' }}>
        Network Management System
      </h1>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left panel */}
        <div style={{ flex: '0 0 280px' }}>
          <h2>Inject Switch Data</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px' }}>
              Hostname
              <input
                type="text"
                value={form.hostname}
                onChange={e => setForm(f => ({ ...f, hostname: e.target.value }))}
                placeholder="sw-core-01"
                style={{ display: 'block', width: '100%', marginTop: '3px' }}
              />
            </label>
            <label style={{ fontSize: '12px' }}>
              IP Address
              <input
                type="text"
                value={form.ip_address}
                onChange={e => setForm(f => ({ ...f, ip_address: e.target.value }))}
                placeholder="192.168.1.1"
                style={{ display: 'block', width: '100%', marginTop: '3px' }}
              />
            </label>
            <label style={{ fontSize: '12px' }}>
              Extra JSON Payload
              <textarea
                value={form.payload}
                onChange={e => setForm(f => ({ ...f, payload: e.target.value }))}
                rows={5}
                style={{ display: 'block', width: '100%', marginTop: '3px' }}
              />
            </label>
            <button type="submit">Submit</button>
            {submitMsg && (
              <span className={submitMsg.ok ? 'status-ok' : 'status-error'} style={{ fontSize: '12px' }}>
                {submitMsg.text}
              </span>
            )}
          </form>

          <h2>Active Switches ({switches.length})</h2>
          {switches.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#8b949e' }}>None registered yet</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {switches.map((sw, i) => (
                <li key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '4px', padding: '8px 10px', fontSize: '12px' }}>
                  <strong className="status-ok">{sw.hostname || '—'}</strong>
                  <span style={{ color: '#8b949e' }}> {sw.ip_address || 'no IP'}</span>
                  <div style={{ color: '#8b949e', marginTop: '2px' }}>
                    {new Date(sw.last_seen).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel */}
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ margin: 0 }}>Records ({records.length})</h2>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              Auto-refresh 10s
            </label>
            <button onClick={fetchData} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            {error && <span className="status-error" style={{ fontSize: '12px' }}>{error}</span>}
          </div>
          <SwitchTable records={records} />
        </div>

      </div>
    </div>
  );
}
