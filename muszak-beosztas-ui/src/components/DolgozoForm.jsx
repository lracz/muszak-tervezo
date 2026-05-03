// Dolgozó űrlap komponens - új dolgozó hozzáadásához
import { useState } from "react";

function DolgozoForm({ mentesKezelo }) {
  // Űrlap állapot
  const [nev, setNev] = useState("");
  const [email, setEmail] = useState("");
  const [telefonszam, setTelefonszam] = useState("");
  const [pozicio, setPozicio] = useState("");
  const [hibaUzenet, setHibaUzenet] = useState("");

  // Űrlap beküldése
  const urlapBekuldese = async (e) => {
    e.preventDefault();
    setHibaUzenet("");

    // Egyszerű validáció
    if (!nev.trim()) {
      setHibaUzenet("A név megadása kötelező!");
      return;
    }

    const ujDolgozo = {
      nev: nev.trim(),
      email: email.trim(),
      telefonszam: telefonszam.trim(),
      pozicio: pozicio.trim(),
    };

    try {
      await mentesKezelo(ujDolgozo);
      // Űrlap ürítése sikeres mentés után
      setNev("");
      setEmail("");
      setTelefonszam("");
      setPozicio("");
    } catch (hiba) {
      setHibaUzenet("Hiba történt a mentés során!");
    }
  };

  return (
    <div className="form-container">
      <h2>➕ Új dolgozó hozzáadása</h2>

      {hibaUzenet && <div className="hiba-uzenet">{hibaUzenet}</div>}

      <form onSubmit={urlapBekuldese}>
        <div className="form-mezo">
          <label htmlFor="nev">Név *</label>
          <input
            id="nev"
            type="text"
            value={nev}
            onChange={(e) => setNev(e.target.value)}
            placeholder="Pl. Kovács János"
          />
        </div>

        <div className="form-mezo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Pl. kovacs.janos@ceg.hu"
          />
        </div>

        <div className="form-mezo">
          <label htmlFor="telefonszam">Telefonszám</label>
          <input
            id="telefonszam"
            type="text"
            value={telefonszam}
            onChange={(e) => setTelefonszam(e.target.value)}
            placeholder="Pl. +36 30 123 4567"
          />
        </div>

        <div className="form-mezo">
          <label htmlFor="pozicio">Pozíció</label>
          <input
            id="pozicio"
            type="text"
            value={pozicio}
            onChange={(e) => setPozicio(e.target.value)}
            placeholder="Pl. Pénztáros"
          />
        </div>

        <button type="submit" className="btn-mentes">
          💾 Mentés
        </button>
      </form>
    </div>
  );
}

export default DolgozoForm;
