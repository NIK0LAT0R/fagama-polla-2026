
import { useEffect, useRef, useState } from 'react';
import { useAdmin } from './context/AdminContext.jsx';
import { useApp } from './context/AppContext.jsx';

import PlayerClaimScreen from './components/Claim/PlayerClaimScreen.jsx';
import Navigation from './components/Layout/Navigation.jsx';
import Leaderboard from './components/Leaderboard/Leaderboard.jsx';
import MatchesPredictions from './components/Matches/MatchesPredictions.jsx';
import PlayerManagement from './components/Players/PlayerManagement.jsx';
import ResultsInput from './components/Results/ResultsInput.jsx';
import RulesInfo from './components/Rules/RulesInfo.jsx';

import { MATCH_COUNT } from './data/matches.js';
import { getPlayerImageSrc, getPlayerInitials } from './utils/playerImages.js';
import { clearClaimedPlayerId, clearActingPlayerId } from './services/storage.js';
import { resetAnonymousSession } from './services/firebase.js';

import './App.css';

function LoadingScreen() {
  return (
    <div className="app">
      <main className="app-main">
        <section className="panel">
          <p className="empty-state">Conectando…</p>
        </section>
      </main>
    </div>
  );
}

function HeaderSelectedPlayer({
  claimedPlayer,
  activePlayer,
  switchablePlayers,
  onSwitchPlayer,
  onSignOutPlayer,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  if (!activePlayer) return null;

  const canSwitch =
    Array.isArray(switchablePlayers) && switchablePlayers.length > 1;

  function handleToggleMenu() {
    if (!canSwitch) return;
    setMenuOpen((prev) => !prev);
  }

  function handleSelectPlayer(playerId) {
    onSwitchPlayer(playerId);
    setMenuOpen(false);
  }

  return (
    <div className="header-selected-player-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="header-selected-player"
        onClick={handleToggleMenu}
      >
        <div className="header-selected-player__avatar">
          {!imageFailed ? (
            <img
              src={getPlayerImageSrc(activePlayer.name)}
              alt={activePlayer.name}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="header-selected-player__fallback">
              {getPlayerInitials(activePlayer.name)}
            </span>
          )}
        </div>

        <div className="header-selected-player__text">
          <span className="header-selected-player__label">Jugador actual</span>
          <strong>{activePlayer.name}</strong>

          {claimedPlayer &&
            String(activePlayer.id) !== String(claimedPlayer.id) && (
              <span className="header-selected-player__sub">
                Sesión delegada por {claimedPlayer.name}
              </span>
            )}
        </div>

        {canSwitch && (
          <span className="header-selected-player__caret" aria-hidden="true">
            ▾
          </span>
        )}
      </button>

      {canSwitch && menuOpen && (
        <div className="header-player-switch-menu">
          {switchablePlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className={`header-player-switch-option ${
                String(player.id) === String(activePlayer.id) ? 'active' : ''
              }`}
              onClick={() => handleSelectPlayer(player.id)}
            >
              {player.name}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn-ghost btn-sm header-player-logout"
        onClick={onSignOutPlayer}
        title="Cambiar de jugador"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // ✅ nuevo: jugador seleccionado desde Leaderboard
  const [viewerPlayerFromLeaderboard, setViewerPlayerFromLeaderboard] =
    useState(null);

  const previousClaimedPlayerIdRef = useRef(null);

  const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
  const {
    claimStatus,
    claimedPlayer,
    activePlayer,
    switchablePlayers,
    switchActivePlayer,
  } = useApp();

  useEffect(() => {
    // Jugador normal no debe ver Results
    if (!isAdmin && activeTab === 'results') {
      setActiveTab('matches');
    }

    // Admin no debe ver Rules
    if (isAdmin && activeTab === 'rules') {
      setActiveTab('matches');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    const currentClaimedId = claimedPlayer?.id ?? null;
    const previousClaimedId = previousClaimedPlayerIdRef.current;

    // Si cambia el jugador reclamado, cerrar modo admin
    if (
      previousClaimedId !== null &&
      String(previousClaimedId) !== String(currentClaimedId)
    ) {
      logoutAdmin();
    }

    previousClaimedPlayerIdRef.current = currentClaimedId;
  }, [claimedPlayer, logoutAdmin]);

  useEffect(() => {
    if (claimStatus === 'unclaimed' && isAdmin) {
      logoutAdmin();
    }
  }, [claimStatus, isAdmin, logoutAdmin]);

  async function handleLogoClick() {
    if (isAdmin) return;

    const password = window.prompt('Ingrese contraseña de administrador');
    if (!password) return;

    try {
      const success = await loginAdmin(password);

      if (success) {
        window.alert('Modo admin activado');
      } else {
        window.alert('Contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error al activar modo admin:', error);
      window.alert('Contraseña incorrecta');
    }
  }

  async function handlePlayerSignOut() {
    const confirmed = window.confirm(
      '¿Deseas cerrar la sesión del jugador actual y volver a la selección de figurita?'
    );

    if (!confirmed) return;

    try {
      logoutAdmin();
      clearClaimedPlayerId();
      clearActingPlayerId();
      await resetAnonymousSession();
      window.location.reload();
    } catch (error) {
      console.error('Error changing player session:', error);
      window.alert('No se pudo cerrar la sesión del jugador. Intenta de nuevo.');
    }
  }

  function handleTabChange(nextTab) {
    if (nextTab === activeTab) return;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Tienes cambios sin guardar. Si sales ahora, perderás tus predicciones no guardadas.'
      );

      if (!confirmed) return;
      setHasUnsavedChanges(false);
    }

    setActiveTab(nextTab);
  }

  if (claimStatus === 'loading') {
    return <LoadingScreen />;
  }

  if (claimStatus === 'unclaimed') {
    return <PlayerClaimScreen />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <button
            type="button"
            className="header-logo-trigger"
            onClick={handleLogoClick}
            aria-label="Ingresar como administrador"
            title={isAdmin ? 'Modo admin activo' : 'Acceso administrador'}
          >
            <div className="header-logo-shell">
              {!logoFailed ? (
                <img
                  src="/worldcup-mark.png"
                  alt="Logo mundial"
                  className="header-logo-image"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="header-icon" aria-hidden="true">
                  🏆
                </span>
              )}
            </div>
          </button>

          <div className="header-brand-copy">
            <h1 className="brand-title-script">Fagama Polla 2026</h1>
            <p>Official Sticker Pool · {MATCH_COUNT} partidos</p>
          </div>
        </div>

        <div className="header-right">
          <HeaderSelectedPlayer
            claimedPlayer={claimedPlayer}
            activePlayer={activePlayer ?? claimedPlayer}
            switchablePlayers={switchablePlayers}
            onSwitchPlayer={switchActivePlayer}
            onSignOutPlayer={handlePlayerSignOut}
          />

          {isAdmin && (
            <div className="header-admin">
              <span className="badge admin-badge">Admin mode</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={logoutAdmin}
              >
                Log out admin
              </button>
            </div>
          )}
        </div>
      </header>

      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
      />

      <main className="app-main">
        {activeTab === 'matches' && (
          <MatchesPredictions onDirtyChange={setHasUnsavedChanges} />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            onInspectPlayer={(playerId) => {
              setViewerPlayerFromLeaderboard(String(playerId));
              setActiveTab('players');
            }}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManagement
            externalViewerPlayerId={viewerPlayerFromLeaderboard}
            onViewerConsumed={() => setViewerPlayerFromLeaderboard(null)}
          />
        )}

        {activeTab === 'results' && <ResultsInput />}
        {activeTab === 'rules' && <RulesInfo />}
      </main>

      <footer className="app-footer">
        <p>Datos sincronizados en tiempo real.</p>
      </footer>
    </div>
  );
}
