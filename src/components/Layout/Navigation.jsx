const TABS = [
  { id: 'players', label: 'Jugadores', icon: '🪪' },
  { id: 'matches', label: 'Pronósticos', icon: '⚽' },
  { id: 'results', label: 'Resultados', icon: '📋', adminOnly: true },
  { id: 'rules', label: 'Reglas', icon: '📌', playerOnly: true },
  { id: 'leaderboard', label: 'Tabla', icon: '🏆' },
];

export default function Navigation({ activeTab, onTabChange, isAdmin }) {
  const visibleTabs = TABS.filter((tab) => {
    if (tab.adminOnly) return isAdmin;
    if (tab.playerOnly) return !isAdmin;
    return true;
  });

  return (
    <nav className="navigation" aria-label="Main navigation">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
