// Elérhetőség kezelő komponens - dolgozók elérhetőségének beállítása
import { useState, useEffect } from "react";
import { elerhetosegekLekerdezese, elerhetosegLetrehozasa, elerhetosegTorlese } from "../services/elerhetosegService";

function ElerhetosegKezelo({ dolgozok }) {
  const [elerhetosegek, setElerhetosegek] = useState([]);
  const [kivalasztottDolgozo, setKivalasztottDolgozo] = useState("");
  const [nap, setNap] = useState("Hétfő");
  const [elerheto, setElerheto] = useState(true);
  const [megjegyzes, setMegjegyzes] = useState("");
  const [betoltes, setBetoltes] = useState(true);
  const [hibaUzenet, setHibaUzenet] = useState("");

  const napok = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

  useEffect(() => {
    adatokBetoltese();
  }, []);

  const adatokBetoltese = async () => {
    try {
      setBetoltes(true);
      const adat = await elerhetosegekLekerdezese();
      setElerhetosegek(adat);
    } catch (hiba) {
      setHibaUzenet("Nem sikerült betölteni az elérhetőségeket.");
    } finally {
      setBetoltes(false);
    }
  };

  const ujElerhetosegMentese = async (e) => {
    e.preventDefault();
    setHibaUzenet("");

    if (!kivalasztottDolgozo) {
      setHibaUzenet("Válassz ki egy dolgozót!");
      return;
    }

    try {
      await elerhetosegLetrehozasa({
        dolgozoId: kivalasztottDolgozo,
        nap,
        elerheto,
        megjegyzes: megjegyzes.trim(),
      });
      setMegjegyzes("");
      await adatokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a mentés során!");
    }
  };

  const torlesKezelese = async (id) => {
    if (!window.confirm("Biztosan törölni szeretnéd?")) return;
    try {
      await elerhetosegTorlese(id);
      await adatokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a törlés során!");
    }
  };

  // Dolgozó neve megkeresése ID alapján
  const dolgozoNev = (id) => {
    const dolgozo = dolgozok.find((d) => d.id === id);
    return dolgozo ? dolgozo.nev : id;
  };

  return (
    <div className="elerhetoseg-container">
      <div className="form-container">
        <h2>📅 Elérhetőség beállítása</h2>
        {hibaUzenet && <div className="hiba-uzenet">{hibaUzenet}</div>}
        <form onSubmit={ujElerhetosegMentese}>
          <div className="form-mezo">
            <label htmlFor="dolgozo-valaszto">Dolgozó *</label>
            <select id="dolgozo-valaszto" value={kivalasztottDolgozo}
              onChange={(e) => setKivalasztottDolgozo(e.target.value)} className="form-select">
              <option value="">-- Válassz dolgozót --</option>
              {dolgozok.map((d) => (
                <option key={d.id} value={d.id}>{d.nev}</option>
              ))}
            </select>
          </div>
          <div className="form-sor">
            <div className="form-mezo">
              <label htmlFor="elerh-nap">Nap</label>
              <select id="elerh-nap" value={nap} onChange={(e) => setNap(e.target.value)} className="form-select">
                {napok.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div className="form-mezo">
              <label className="checkbox-label">
                <input type="checkbox" checked={elerheto}
                  onChange={(e) => setElerheto(e.target.checked)} />
                Elérhető
              </label>
            </div>
          </div>
          <div className="form-mezo">
            <label htmlFor="megjegyzes">Megjegyzés</label>
            <input id="megjegyzes" type="text" value={megjegyzes}
              onChange={(e) => setMegjegyzes(e.target.value)}
              placeholder="Pl. Szabadság, betegség..." />
          </div>
          <button type="submit" className="btn-mentes">💾 Mentés</button>
        </form>
      </div>

      <div className="lista-container">
        <h2>📋 Beállított elérhetőségek ({elerhetosegek.length} db)</h2>
        {betoltes ? (
          <p className="betoltes">⏳ Betöltés...</p>
        ) : elerhetosegek.length === 0 ? (
          <p className="ures-lista-szoveg">Még nincs beállított elérhetőség.</p>
        ) : (
          <table className="dolgozo-tabla">
            <thead>
              <tr>
                <th>Dolgozó</th>
                <th>Nap</th>
                <th>Státusz</th>
                <th>Megjegyzés</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {elerhetosegek.map((e) => (
                <tr key={e.id} className={e.elerheto ? "" : "nem-elerheto"}>
                  <td>{dolgozoNev(e.dolgozoId)}</td>
                  <td>{e.nap}</td>
                  <td>
                    <span className={`statusz-badge ${e.elerheto ? "elerheto" : "nem-elerheto-badge"}`}>
                      {e.elerheto ? "✅ Elérhető" : "❌ Nem elérhető"}
                    </span>
                  </td>
                  <td>{e.megjegyzes || "—"}</td>
                  <td>
                    <button className="btn-torles" onClick={() => torlesKezelese(e.id)}>
                      🗑️ Törlés
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ElerhetosegKezelo;
