// Műszak lista komponens - műszakok megjelenítése táblázatban
function MuszakLista({ muszakok, torlesKezelo, betoltes }) {
  if (betoltes) {
    return <p className="betoltes">⏳ Műszakok betöltése...</p>;
  }

  if (muszakok.length === 0) {
    return (
      <div className="ures-lista">
        <p>🏭 Még nincsenek műszakok az adatbázisban.</p>
        <p>Használd a fenti űrlapot az első műszak hozzáadásához!</p>
      </div>
    );
  }

  // Műszak típus színek
  const muszakSzin = (megnevezes) => {
    const nev = megnevezes.toLowerCase();
    if (nev.includes("reggeli") || nev.includes("délelőtt")) return "muszak-reggeli";
    if (nev.includes("délutáni") || nev.includes("délután")) return "muszak-delutani";
    if (nev.includes("éjszakai") || nev.includes("éjszaka")) return "muszak-ejszakai";
    return "";
  };

  return (
    <div className="lista-container">
      <h2>📋 Műszakok listája ({muszakok.length} db)</h2>
      <table className="dolgozo-tabla">
        <thead>
          <tr>
            <th>Megnevezés</th>
            <th>Pozíció</th>
            <th>Nap</th>
            <th>Kezdés</th>
            <th>Befejezés</th>
            <th>Létszám</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
          {muszakok.map((muszak) => (
            <tr key={muszak.id} className={muszakSzin(muszak.megnevezes)}>
              <td><strong>{muszak.megnevezes}</strong></td>
              <td><span className="statusz-badge elerheto">{muszak.pozicio || "Vegyes"}</span></td>
              <td>{muszak.nap}</td>
              <td>{muszak.kezdes}</td>
              <td>{muszak.befejezes}</td>
              <td>{muszak.szuksegesLetszam} fő</td>
              <td>
                <button className="btn-torles" onClick={() => torlesKezelo(muszak.id)}>
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

export default MuszakLista;
