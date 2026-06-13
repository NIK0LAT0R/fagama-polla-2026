import { useEffect, useRef, useState } from 'react';

export default function AdminPasswordModal({ open, error, onSubmit, onClose }) {
  const [password, setPassword] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(password);
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 id="admin-modal-title">Se requiere acceso de administrador</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <p className="modal-body-text">
          Ingresa la contraseña de administrador para gestionar jugadores y resultados.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            className="modal-input"
            placeholder="Contraseña de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label="Contraseña de administrador"
            autoComplete="current-password"
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Desbloquear admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
