export default function AdminSettings() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div className="page-header" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
        <div className="page-header-left">
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-sub">Configure platform variables.</p>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-state-icon">⚙️</div>
        <h3>Settings Coming Soon</h3>
        <p>Global platform configuration options will be available here.</p>
      </div>
    </div>
  );
}
