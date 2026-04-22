export default function SwitchTable({ records }) {
  if (records.length === 0) {
    return <p style={{ color: '#8b949e', fontSize: '13px', marginTop: '8px' }}>No records yet.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Hostname</th>
            <th>IP Address</th>
            <th>Data</th>
            <th>Received At</th>
          </tr>
        </thead>
        <tbody>
          {records.map(row => (
            <tr key={row.id}>
              <td style={{ color: '#8b949e' }}>{row.id}</td>
              <td>{row.hostname || <span style={{ color: '#8b949e' }}>—</span>}</td>
              <td>{row.ip_address || <span style={{ color: '#8b949e' }}>—</span>}</td>
              <td>
                <pre style={{ margin: 0, maxWidth: '420px', overflowX: 'auto', fontSize: '11px', color: '#e3b341' }}>
                  {JSON.stringify(row.data, null, 2)}
                </pre>
              </td>
              <td style={{ whiteSpace: 'nowrap', color: '#8b949e' }}>
                {new Date(row.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
