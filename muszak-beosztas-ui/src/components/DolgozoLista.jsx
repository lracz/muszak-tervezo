// Dolgozó lista komponens - dolgozók megjelenítése táblázatban
function DolgozoLista({ dolgozok, torlesKezelo, betoltes }) {
  // Betöltés állapot megjelenítése
  if (betoltes) {
    return <p className="betoltes">⏳ Dolgozók betöltése...</p>;
  }

  // Ha nincsenek dolgozók
  if (dolgozok.length === 0) {
    return (
      <div className="ures-lista">
        <p>📋 Még nincsenek dolgozók az adatbázisban.</p>
        <p>Használd a fenti űrlapot az első dolgozó hozzáadásához!</p>
      </div>
    );
  }

  return (
    <div className="lista-container">
      <h2>👥 Dolgozók listája ({dolgozok.length} fő)</h2>

      <table className="dolgozo-tabla">
        <thead>
          <tr>
            <th>Név</th>
            <th>E-mail</th>
            <th>Telefonszám</th>
            <th>Pozíció</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {dolgozok.map((dolgozo) => (
            <tr key={dolgozo.id}>
              <td>{dolgozo.nev}</td>
              <td>{dolgozo.email || "—"}</td>
              <td>{dolgozo.telefonszam || "—"}</td>
              <td>{dolgozo.pozicio || "—"}</td>
              <td>
                <button
                  className="btn-torles"
                  onClick={() => torlesKezelo(dolgozo.id)}
                >
                  🗑️ Törlés
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DolgozoLista;
