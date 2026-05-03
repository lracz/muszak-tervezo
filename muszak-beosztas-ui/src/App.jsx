// Fő alkalmazás komponens - tab-alapú navigációval
import { useState, useEffect, useContext } from "react";
import DolgozoForm from "./components/DolgozoForm";
import DolgozoLista from "./components/DolgozoLista";
import MuszakForm from "./components/MuszakForm";
import MuszakLista from "./components/MuszakLista";
import ElerhetosegKezelo from "./components/ElerhetosegKezelo";
import BeosztasNezet from "./components/BeosztasNezet";
import {
  dolgozokLekerdezese,
  dolgozoLetrehozasa,
  dolgozoTorlese,
} from "./services/dolgozoService";
import {
  muszakokLekerdezese,
  muszakLetrehozasa,
  muszakTorlese,
} from "./services/muszakService";
import { AuthContext } from "./contexts/AuthContext";
import Login from "./components/Login";
import "./App.css";

function App() {
  const { token, user, isHR, logout } = useContext(AuthContext);

  // Aktív tab kezelése
  const [aktivTab, setAktivTab] = useState("beosztas"); // Alapértelmezett legyen a beosztás

  // Dolgozók állapot
  const [dolgozok, setDolgozok] = useState([]);
  const [dolgozoBetoltes, setDolgozoBetoltes] = useState(true);

  // Műszakok állapot
  const [muszakok, setMuszakok] = useState([]);
  const [muszakBetoltes, setMuszakBetoltes] = useState(true);

  // Globális hiba
  const [hibaUzenet, setHibaUzenet] = useState("");

  // Adatok betöltése induláskort
  useEffect(() => {
    if (token) {
      dolgozokBetoltese();
      muszakokBetoltese();
    }
  }, [token]);

  // === Dolgozó műveletek ===
  const dolgozokBetoltese = async () => {
    try {
      setDolgozoBetoltes(true);
      setHibaUzenet("");
      const adat = await dolgozokLekerdezese();
      setDolgozok(adat);
    } catch (hiba) {
      setHibaUzenet("Nem sikerült betölteni a dolgozókat. Ellenőrizd, hogy fut-e a szerver!");
    } finally {
      setDolgozoBetoltes(false);
    }
  };

  const ujDolgozoMentese = async (dolgozo) => {
    try {
      setHibaUzenet("");
      await dolgozoLetrehozasa(dolgozo);
      await dolgozokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a dolgozó mentésekor!");
      throw hiba;
    }
  };

  const dolgozoTorlesKezelese = async (id) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a dolgozót?")) return;
    try {
      setHibaUzenet("");
      await dolgozoTorlese(id);
      await dolgozokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a dolgozó törlésekor!");
    }
  };

  // === Műszak műveletek ===
  const muszakokBetoltese = async () => {
    try {
      setMuszakBetoltes(true);
      const adat = await muszakokLekerdezese();
      setMuszakok(adat);
    } catch (hiba) {
      // Csendben kezeljük, nem feltétlen kritikus
      console.error("Műszakok betöltési hiba:", hiba);
    } finally {
      setMuszakBetoltes(false);
    }
  };

  const ujMuszakMentese = async (muszak) => {
    try {
      setHibaUzenet("");
      await muszakLetrehozasa(muszak);
      await muszakokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a műszak mentésekor!");
      throw hiba;
    }
  };

  const muszakTorlesKezelese = async (id) => {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a műszakot?")) return;
    try {
      setHibaUzenet("");
      await muszakTorlese(id);
      await muszakokBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba történt a műszak törlésekor!");
    }
  };

  // Tab-ok definíciója jogosultság alapján
  const tabok = [];
  if (isHR) {
    tabok.push({ id: "dolgozok", cimke: "👥 Dolgozók", ikon: "👥" });
    tabok.push({ id: "muszakok", cimke: "🏭 Műszakok", ikon: "🏭" });
  }
  tabok.push({ id: "elerhetoseg", cimke: "📅 Elérhetőség", ikon: "📅" });
  tabok.push({ id: "beosztas", cimke: "📊 Beosztás", ikon: "📊" });

  // Aktív tab tartalma
  const tabTartalom = () => {
    switch (aktivTab) {
      case "dolgozok":
        return (
          <>
            <DolgozoForm mentesKezelo={ujDolgozoMentese} />
            <DolgozoLista dolgozok={dolgozok} torlesKezelo={dolgozoTorlesKezelese} betoltes={dolgozoBetoltes} />
          </>
        );
      case "muszakok":
        return (
          <>
            <MuszakForm mentesKezelo={ujMuszakMentese} />
            <MuszakLista muszakok={muszakok} torlesKezelo={muszakTorlesKezelese} betoltes={muszakBetoltes} />
          </>
        );
      case "elerhetoseg":
        return <ElerhetosegKezelo dolgozok={dolgozok} />;
      case "beosztas":
        return <BeosztasNezet dolgozok={dolgozok} muszakok={muszakok} />;
      default:
        return null;
    }
  };

  if (!token) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="fejlec" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🗓️ Műszak Beosztás Tervező</h1>
          <p>Üdvözöllek, {user?.nev} ({user?.szerepkor})</p>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Kijelentkezés
        </button>
      </header>

      {/* Tab navigáció */}
      <nav className="tab-nav">
        {tabok.map((tab) => (
          <button
            key={tab.id}
            className={`tab-gomb ${aktivTab === tab.id ? "aktiv" : ""}`}
            onClick={() => setAktivTab(tab.id)}
          >
            {tab.cimke}
          </button>
        ))}
      </nav>

      <main className="fo-tartalom">
        {hibaUzenet && <div className="hiba-banner">{hibaUzenet}</div>}
        {tabTartalom()}
      </main>

      <footer className="lablec">
        <p>Projektlabor 2 – Műszak Beosztás Tervező © 2026</p>
      </footer>
    </div>
  );
}

export default App;
