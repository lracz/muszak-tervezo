// Műszak űrlap komponens - új műszak hozzáadásához
import { useState } from "react";

function MuszakForm({ mentesKezelo }) {
  const [megnevezes, setMegnevezes] = useState("");
  const [kezdes, setKezdes] = useState("06:00");
  const [befejezes, setBefejezes] = useState("14:00");
  const [nap, setNap] = useState("Hétfő");
  const [szuksegesLetszam, setSzuksegesLetszam] = useState(1);
  const [pozicio, setPozicio] = useState("Vegyes");
  const [hibaUzenet, setHibaUzenet] = useState("");

  const napok = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

  const urlapBekuldese = async (e) => {
    e.preventDefault();
    setHibaUzenet("");

    if (!megnevezes.trim()) {
      setHibaUzenet("A műszak megnevezése kötelező!");
      return;
    }

    const ujMuszak = {
      megnevezes: megnevezes.trim(),
      kezdes,
      befejezes,
      nap,
      szuksegesLetszam: parseInt(szuksegesLetszam) || 1,
      pozicio: pozicio
    };

    try {
      await mentesKezelo(ujMuszak);
      setMegnevezes("");
      setKezdes("06:00");
      setBefejezes("14:00");
      setNap("Hétfő");
      setSzuksegesLetszam(1);
      setPozicio("Vegyes");
    } catch (hiba) {
      setHibaUzenet("Hiba történt a mentés során!");
    }
  };

  return (
    <div className="form-container">
      <h2>🏭 Új műszak hozzáadása</h2>
      {hibaUzenet && <div className="hiba-uzenet">{hibaUzenet}</div>}
      <form onSubmit={urlapBekuldese}>
        <div className="form-sor">
          <div className="form-mezo">
            <label htmlFor="megnevezes">Megnevezés *</label>
            <input id="megnevezes" type="text" value={megnevezes}
              onChange={(e) => setMegnevezes(e.target.value)}
              placeholder="Pl. Reggeli műszak" />
          </div>
          <div className="form-mezo">
            <label htmlFor="pozicio">Szükséges pozíció</label>
            <select id="pozicio" value={pozicio} onChange={(e) => setPozicio(e.target.value)} className="form-select">
              <option value="Szakács">👨‍🍳 Szakács</option>
              <option value="Pincér">🍽️ Pincér</option>
              <option value="Pultos">🍸 Pultos</option>
              <option value="Konyhai kisegítő">🧼 Konyhai kisegítő</option>
              <option value="Vegyes">🔄 Vegyes / Általános</option>
            </select>
          </div>
        </div>
        <div className="form-sor">
          <div className="form-mezo">
            <label htmlFor="kezdes">Kezdés</label>
            <input id="kezdes" type="time" value={kezdes}
              onChange={(e) => setKezdes(e.target.value)} />
          </div>
          <div className="form-mezo">
            <label htmlFor="befejezes">Befejezés</label>
            <input id="befejezes" type="time" value={befejezes}
              onChange={(e) => setBefejezes(e.target.value)} />
          </div>
        </div>
        <div className="form-sor">
          <div className="form-mezo">
            <label htmlFor="nap">Nap</label>
            <select id="nap" value={nap} onChange={(e) => setNap(e.target.value)} className="form-select">
              {napok.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <div className="form-mezo">
            <label htmlFor="letszam">Szükséges létszám</label>
            <input id="letszam" type="number" min="1" max="50" value={szuksegesLetszam}
              onChange={(e) => setSzuksegesLetszam(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="btn-mentes">💾 Mentés</button>
      </form>
    </div>
  );
}

export default MuszakForm;
