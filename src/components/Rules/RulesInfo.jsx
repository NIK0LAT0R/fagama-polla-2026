
export default function RulesInfo() {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Reglas y pagos</h2>
          <p className="panel-subtitle">
            Información oficial de la Polla Mundialista Fagama 2026.
          </p>
        </div>
      </header>

      <div className="rules-layout">
        <div className="rules-column">
          <article className="rules-card">
            <h3>Inscripción</h3>
            <p>
              La inscripción consta de un único pago por valor de <strong>$20.000</strong>.
            </p>
            <p>
              Fecha límite de pago: <strong>miércoles 10 de junio de 2026 antes de las 11:59 p. m.</strong>
            </p>
          </article>

          <article className="rules-card">
            <h3>Puntuación oficial</h3>
            <ul className="rules-list">
              <li><strong>5 puntos</strong> si aciertas el marcador exacto.</li>
              <li><strong>3 puntos</strong> si aciertas el ganador o empate.</li>
              <li><strong>1 punto</strong> por acertar los goles del equipo A.</li>
              <li><strong>1 punto</strong> por acertar los goles del equipo B.</li>
            </ul>
            <p className="rules-note">
              Si aciertas el marcador exacto, el total del partido será de 5 puntos.
            </p>
          </article>

          <article className="rules-card">
            <h3>Reglas generales</h3>
            <ul className="rules-list">
              <li>Las predicciones se deben enviar máximo hasta las 11:59 p. m. del día anterior al partido.</li>
              <li>Una vez bloqueado el partido, no se podrán corregir ni editar marcadores.</li>
              <li>Los puntajes se irán acumulando a lo largo de todo el mundial.</li>
              <li>Habrá un premio especial para quienes acierten campeón y subcampeón.</li>
            </ul>
          </article>

          <article className="rules-card">
            <h3>Premiación</h3>
            <ul className="rules-list">
              <li><strong>1.er lugar:</strong> 50% del dinero recaudado</li>
              <li><strong>2.º lugar:</strong> 25% del dinero recaudado</li>
              <li><strong>3.er lugar:</strong> 15% del dinero recaudado</li>
              <li><strong>Premio especial:</strong> 10% del dinero recaudado</li>
            </ul>
          </article>
        </div>

        <aside className="rules-payment-panel">
          <div className="rules-payment-card">
            <h3>Medios de pago</h3>
            <p>
              Realiza tu pago y compártelo con el administrador antes de la fecha límite.
            </p>

            <div className="payment-methods">
              <div className="payment-method">
                <span className="payment-label">Valor</span>
                <strong>$20.000</strong>
              </div>
              <div className="payment-method">
                <span className="payment-label">Concepto</span>
                <strong>Polla Mundialista 2026</strong>
              </div>
            </div>

            <div className="qr-box">
              <img src="/payments/qr-fagama.png" alt="QR de pago" className="qr-image" />
            </div>

            <p className="qr-help">
              Escanea este código QR para realizar el pago de la inscripción.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
