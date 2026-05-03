// Beosztás nézet komponens - heti naptár grid megjelenítés
import { useState, useEffect, useContext } from "react";
import { hetiBeosztasLekerdezese, beosztasGeneralasa, beosztasVeglegesitese } from "../services/beosztasService";
import { AuthContext } from "../contexts/AuthContext";
import HetValaszto from "./HetValaszto";

function BeosztasNezet({ dolgozok, muszakok }) {
  const { user, isHR } = useContext(AuthContext);
  
  const [het, setHet] = useState(() => {
    const ma = new Date();
    const evKezdete = new Date(ma.getFullYear(), 0, 1);
    const napok = Math.floor((ma - evKezdete) / (24 * 60 * 60 * 1000));
    const hetSzam = Math.ceil((napok + evKezdete.getDay() + 1) / 7);
    return `${ma.getFullYear()}-W${String(hetSzam).padStart(2, "0")}`;
  });
  const [beosztas, setBeosztas] = useState(null);
  const [betoltes, setBetoltes] = useState(false);
  const [generalas, setGeneralas] = useState(false);
  const [hibaUzenet, setHibaUzenet] = useState("");

  const napok = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

  useEffect(() => {
    beosztasBetoltese();
  }, [het]);

  const beosztasBetoltese = async () => {
    try {
      setBetoltes(true);
      setHibaUzenet("");
      const adat = await hetiBeosztasLekerdezese(het);
      setBeosztas(adat);
    } catch (hiba) {
      setHibaUzenet("Hiba a beosztás betöltésekor.");
    } finally {
      setBetoltes(false);
    }
  };

  const beosztasGeneralasKezelese = async () => {
    try {
      setGeneralas(true);
      setHibaUzenet("");
      await beosztasGeneralasa(het);
      await beosztasBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba a beosztás generálásakor. Ellenőrizd, hogy vannak-e műszakok és dolgozók!");
    } finally {
      setGeneralas(false);
    }
  };

  const veglegesitesKezelese = async () => {
    if (!beosztas?.id) return;
    if (!window.confirm("Biztosan véglegesíted a beosztást?")) return;
    try {
      await beosztasVeglegesitese(beosztas.id);
      await beosztasBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba a véglegesítés során.");
    }
  };

  const handleExportCSV = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/export/csv/${het}`;
  };

  const handleExportICal = () => {
    if (user?.id) {
      window.location.href = `${import.meta.env.VITE_API_URL}/api/export/ical/${het}/${user.id}`;
    }
  };

  // Dolgozó neve ID alapján
  const dolgozoNev = (id) => {
    const d = dolgozok.find((d) => d.id === id);
    return d ? d.nev : "?";
  };

  // Műszak adatai ID alapján
  const muszakAdat = (id) => {
    return muszakok.find((m) => m.id === id);
  };

  // Műszak típus CSS osztály
  const muszakClass = (megnevezes) => {
    if (!megnevezes) return "muszak-cell";
    const nev = megnevezes.toLowerCase();
    if (nev.includes("reggeli") || nev.includes("délelőtt")) return "muszak-cell muszak-reggeli";
    if (nev.includes("délutáni") || nev.includes("délután")) return "muszak-cell muszak-delutani";
    if (nev.includes("éjszakai") || nev.includes("éjszaka")) return "muszak-cell muszak-ejszakai";
    return "muszak-cell";
  };

  // Naptár grid adatok rendezése
  const naptarAdatok = () => {
    if (!beosztas?.reszletek) return {};
    const grid = {};
    napok.forEach((nap) => { grid[nap] = []; });

    beosztas.reszletek.forEach((r) => {
      if (grid[r.nap]) {
        grid[r.nap].push(r);
      }
    });
    return grid;
  };

  const grid = naptarAdatok();

  return (
    <div className="beosztas-container">
      <div className="beosztas-fejlec">
        <h2>📊 Heti Beosztás</h2>
        <HetValaszto het={het} hetValtozas={setHet} />
        <div className="beosztas-gombok">
          {beosztas && (
            <>
              <button className="btn-secondary" onClick={handleExportCSV} title="Táblázat kimentése (HR / Nyomtatás)">
                📊 CSV Export
              </button>
              <button className="btn-secondary" onClick={handleExportICal} title="Szinkronizálás az okostelefonoddal">
                📅 iCal Szinkronizálás
              </button>
            </>
          )}

          {isHR && (
            <>
              <button className="btn-general" onClick={beosztasGeneralasKezelese}
                disabled={generalas}>
                {generalas ? "⏳ Generálás..." : "⚡ Beosztás Generálás"}
              </button>
              {beosztas && beosztas.allapot === "Tervezet" && (
                <button className="btn-veglegesit" onClick={veglegesitesKezelese}>
                  ✅ Véglegesítés
                </button>
              )}
            </>
          )}
        </div>
        {beosztas && (
          <span className={`allapot-badge ${beosztas.allapot === "Végleges" ? "vegleges" : "tervezet"}`}>
            {beosztas.allapot}
          </span>
        )}
      </div>

      {hibaUzenet && <div className="hiba-banner">{hibaUzenet}</div>}

      {betoltes ? (
        <p className="betoltes">⏳ Beosztás betöltése...</p>
      ) : !beosztas ? (
        <div className="ures-lista">
          <p>📋 Nincs beosztás erre a hétre.</p>
          <p>Kattints a "Beosztás Generálás" gombra az automatikus generáláshoz!</p>
        </div>
      ) : (
        <div className="naptar-grid">
          {napok.map((nap) => (
            <div key={nap} className="naptar-oszlop">
              <div className="naptar-fejlec">{nap}</div>
              <div className="naptar-cellak">
                {grid[nap]?.length > 0 ? (
                  grid[nap].map((r, idx) => {
                    const m = muszakAdat(r.muszakId);
                    return (
                      <div key={idx} className={muszakClass(m?.megnevezes)}>
                        <span className="muszak-nev">{m?.megnevezes || "Műszak"}</span>
                        <span className="muszak-ido">{m?.kezdes} - {m?.befejezes}</span>
                        <span className="dolgozo-nev">{dolgozoNev(r.dolgozoId)}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="ures-nap">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BeosztasNezet;
