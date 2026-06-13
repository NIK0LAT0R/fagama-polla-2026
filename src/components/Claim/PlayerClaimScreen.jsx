
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { claimPlayerInCosmos } from '../../services/cosmosApi.js';
import { saveClaimedPlayerId } from '../../services/storage.js';
import { getPlayerImageSrc, getPlayerInitials } from '../../utils/playerImages.js';

const ERROR_MESSAGES = {
  WRONG_CODE: 'Código incorrecto',
  ALREADY_CLAIMED: 'Este jugador ya está vinculado a otro dispositivo',
  PLAYER_NOT_FOUND: 'Jugador no encontrado',
  GENERIC: 'No se pudo vincular el jugador. Intenta de nuevo.',
};

function AlbumPlayerCard({ player, selected, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      type="button"
      className={`album-card ${selected ? 'album-card-selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="album-card-bg">
        <span className="album-year">26</span>
        <span className="album-accent album-accent-a" />
        <span className="album-accent album-accent-b" />
      </div>

      <div className="album-card-top">
        <span className="album-card-badge">FAGAMA</span>
        {player.claimedByUid && <span className="album-status-tag">Vinculado</span>}
      </div>

      <div className="album-player-portrait">
        {!imageFailed ? (
          <img
            src={getPlayerImageSrc(player.name)}
            alt={player.name}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="album-player-fallback">
            {getPlayerInitials(player.name)}
          </div>
        )}
      </div>

      <div className="album-card-footer">
        <div className="album-card-name">{player.name}</div>
        <div className="album-card-subtitle">Seleccionar figurita</div>
      </div>
    </button>
  );
}

export default function PlayerClaimScreen() {
  const { players, uid, resolveClaim } = useApp();

  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [playersReady, setPlayersReady] = useState(false);

  const availablePlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const selectedPlayer =
    availablePlayers.find((p) => String(p.id) === String(selectedPlayerId)) ?? null;

  useEffect(() => {
    if (!uid) {
      setPlayersReady(false);
      return;
    }

    const timer = setTimeout(() => {
      setPlayersReady(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [uid, players]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedPlayerId) {
      setError('Selecciona un jugador.');
      return;
    }

    if (!claimCode.trim()) {
      setError('Ingresa tu código.');
      return;
    }

    setSubmitting(true);

    try {
      await claimPlayerInCosmos({
        playerId: selectedPlayerId,
        claimCode,
        uid,
        force: false,
      });

      saveClaimedPlayerId(selectedPlayerId);
      resolveClaim(selectedPlayerId);
    } catch (err) {
      if (err.message === 'ALREADY_CLAIMED') {
        const confirmed = window.confirm(
          'Este jugador ya está vinculado a otro dispositivo. ¿Deseas moverlo a este dispositivo?'
        );

        if (confirmed) {
          try {
            await claimPlayerInCosmos({
              playerId: selectedPlayerId,
              claimCode,
              uid,
              force: true,
            });

            saveClaimedPlayerId(selectedPlayerId);
            resolveClaim(selectedPlayerId);
            setError('');
            return;
          } catch (innerError) {
            setError(ERROR_MESSAGES[innerError.message] ?? ERROR_MESSAGES.GENERIC);
            return;
          }
        }

        setError('Operación cancelada. El jugador sigue vinculado a otro dispositivo.');
      } else {
        setError(ERROR_MESSAGES[err.message] ?? ERROR_MESSAGES.GENERIC);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app claim-app album-app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon" aria-hidden="true">
            ⚽
          </span>
          <div>
            <h1>Fagama Polla 2026</h1>
            <p>Selecciona tu figurita y entra a jugar</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="panel claim-panel album-panel">
          <header className="panel-header">
            <div>
              <h2>Álbum de jugadores</h2>
              <p className="panel-subtitle">
                Elige tu figurita y escribe el código que te compartió el administrador.
              </p>
            </div>
          </header>

          {!playersReady ? (
            <p className="empty-state">Cargando jugadores…</p>
          ) : availablePlayers.length === 0 ? (
            <p className="empty-state">
              No hay jugadores disponibles. Pide al administrador que te agregue.
            </p>
          ) : (
            <form className="claim-form" onSubmit={handleSubmit}>
              <div className="claim-album-column">
                <div className="album-grid album-grid-claim">
                  {availablePlayers.map((player) => (
                    <AlbumPlayerCard
                      key={player.id}
                      player={player}
                      selected={String(selectedPlayerId) === String(player.id)}
                      onSelect={() => setSelectedPlayerId(player.id)}
                    />
                  ))}
                </div>

                {selectedPlayerId && (
                  <div className="claim-floating-panel">
                    <div className="claim-floating-panel__content">
                      <div className="claim-selection-summary">
                        <span className="claim-selection-label">Jugador seleccionado</span>
                        <strong>{selectedPlayer?.name ?? 'Ninguno'}</strong>
                      </div>

                      <label className="claim-label" htmlFor="claim-code">
                        Ingresa tu código
                      </label>

                      <input
                        id="claim-code"
                        type="text"
                        className="claim-code-input"
                        placeholder="CÓDIGO DE ACCESO"
                        value={claimCode}
                        onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={12}
                      />

                      {error && (
                        <p className="form-error" role="alert">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary claim-submit"
                        disabled={submitting}
                      >
                        {submitting ? 'Verificando…' : 'Continuar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
