// Elérhetőség kezelő komponens - dolgozók elérhetőségének beállítása
import { useState, useEffect, useContext } from "react";
import { elerhetosegekLekerdezese, elerhetosegLetrehozasa, elerhetosegTorlese } from "../services/elerhetosegService";
import { AuthContext } from "../contexts/AuthContext";

function ElerhetosegKezelo({ dolgozok }) {
  const { user, isHR } = useContext(AuthContext);
  const [elerhetosegek, setElerhetosegek] = useState([]);
  const [kivalasztottDolgozo, setKivalasztottDolgozo] = useState(isHR ? "" : user?.id);
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

  const dolgozoNev = (id) => {
    const dolgozo = dolgozok.find((d) => d.id === id);
    return dolgozo ? dolgozo.nev : id;
  };

  // Szabadság kvóta számítása (Mock - a valóságban éves szinten naptári dátumok alapján menne)
  const MAX_SZABADSAG = 20;
  const felhasznaltSzabadsag = elerhetosegek.filter(
    e => (!isHR ? e.dolgozoId === user?.id : e.dolgozoId === kivalasztottDolgozo) && !e.elerheto
  ).length;

  const megjelenitettElerhetosegek = isHR 
    ? elerhetosegek 
    : elerhetosegek.filter(e => e.dolgozoId === user?.id);

  return (
    <div className="elerhetoseg-container">
      <div className="form-container">
        <h2>📅 {isHR ? "Elérhetőség beállítása" : "Szabadság és Elérhetőség Igénylése"}</h2>
        {hibaUzenet && <div className="hiba-uzenet">{hibaUzenet}</div>}
        
        {/* Szabadság egyenleg indikátor */}
        {kivalasztottDolgozo && (
          <div style={{
            backgroundColor: '#f8f9fa', border: '1px solid #ddd', padding: '10px 15px', 
            borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between'
          }}>
            <strong>Éves Szabadság Keret:</strong>
            <span style={{ color: felhasznaltSzabadsag > MAX_SZABADSAG ? 'red' : 'green', fontWeight: 'bold' }}>
              {felhasznaltSzabadsag} / {MAX_SZABADSAG} nap
            </span>
          </div>
        )}

        <form onSubmit={ujElerhetosegMentese}>
          <div className="form-mezo">
            <label htmlFor="dolgozo-valaszto">Dolgozó *</label>
            {isHR ? (
              <select id="dolgozo-valaszto" value={kivalasztottDolgozo}
                onChange={(e) => setKivalasztottDolgozo(e.target.value)} className="form-select">
                <option value="">-- Válassz dolgozót --</option>
                {dolgozok.map((d) => (
                  <option key={d.id} value={d.id}>{d.nev}</option>
                ))}
              </select>
            ) : (
              <input type="text" value={user?.nev || ""} disabled className="form-input" style={{backgroundColor: '#e9ecef'}} />
            )}
          </div>
          
          <div className="form-sor">
            <div className="form-mezo">
              <label htmlFor="elerh-nap">Nap</label>
              <select id="elerh-nap" value={nap} onChange={(e) => setNap(e.target.value)} className="form-select">
                {napok.map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div className="form-mezo">
              <label className="checkbox-label" style={{marginTop: '25px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input type="checkbox" checked={elerheto}
                  onChange={(e) => setElerheto(e.target.checked)} 
                  style={{width: '20px', height: '20px'}} />
                <span style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{elerheto ? "Dolgozni szeretnék" : "Szabadság / Nem érek rá"}</span>
              </label>
            </div>
          </div>
          
          <div className="form-mezo">
            <label htmlFor="megjegyzes">Megjegyzés {elerheto ? "(pl. Csak délelőtt jó)" : "(pl. Betegség, Szabadság)"}</label>
            <input id="megjegyzes" type="text" value={megjegyzes}
              onChange={(e) => setMegjegyzes(e.target.value)}
              placeholder="Ide írd az indoklást..." required={!elerheto} />
          </div>
          <button type="submit" className="btn-mentes">💾 {isHR ? "Mentés" : "Igény Leadása"}</button>
        </form>
      </div>

      <div className="lista-container">
        <h2>📋 {isHR ? "Összes beállított elérhetőség" : "Saját leadott igényeim"} ({megjelenitettElerhetosegek.length} db)</h2>
        {betoltes ? (
          <p className="betoltes">⏳ Betöltés...</p>
        ) : megjelenitettElerhetosegek.length === 0 ? (
          <p className="ures-lista-szoveg">Még nincs leadott igény.</p>
        ) : (
          <table className="dolgozo-tabla">
            <thead>
              <tr>
                {isHR && <th>Dolgozó</th>}
                <th>Nap</th>
                <th>Státusz</th>
                <th>Megjegyzés</th>
                <th>Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {megjelenitettElerhetosegek.map((e) => (
                <tr key={e.id} className={e.elerheto ? "" : "nem-elerheto"}>
                  {isHR && <td>{e.dolgozoNev || dolgozoNev(e.dolgozoId)}</td>}
                  <td><strong>{e.nap}</strong></td>
                  <td>
                    <span className={`statusz-badge ${e.elerheto ? "elerheto" : "nem-elerheto-badge"}`}>
                      {e.elerheto ? "✅ Elérhető" : "🏖️ Szabadság"}
                    </span>
                  </td>
                  <td>{e.megjegyzes || "—"}</td>
                  <td>
                    <button className="btn-torles" onClick={() => torlesKezelese(e.id)}>
                      🗑️ Visszavonás
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
