// Hét választó komponens - hét navigáció előre/hátra
import { useState } from "react";

function HetValaszto({ het, hetValtozas }) {
  // Aktuális hét kiszámítása (ISO 8601 hét szám)
  const aktHetSzamitas = () => {
    const ma = new Date();
    const evKezdete = new Date(ma.getFullYear(), 0, 1);
    const napok = Math.floor((ma - evKezdete) / (24 * 60 * 60 * 1000));
    const hetSzam = Math.ceil((napok + evKezdete.getDay() + 1) / 7);
    return `${ma.getFullYear()}-W${String(hetSzam).padStart(2, "0")}`;
  };

  const aktualiso = het || aktHetSzamitas();

  // Hét léptetés
  const hetLeptetes = (irany) => {
    const [ev, hetStr] = aktualiso.split("-W");
    let hetSzam = parseInt(hetStr) + irany;
    let ujEv = parseInt(ev);

    if (hetSzam > 52) {
      hetSzam = 1;
      ujEv++;
    } else if (hetSzam < 1) {
      hetSzam = 52;
      ujEv--;
    }

    const ujHet = `${ujEv}-W${String(hetSzam).padStart(2, "0")}`;
    hetValtozas(ujHet);
  };

  return (
    <div className="het-valaszto">
      <button className="btn-het-nav" onClick={() => hetLeptetes(-1)} title="Előző hét">
        ◀
      </button>
      <div className="het-kijelzo">
        <span className="het-cimke">📅 Hét</span>
        <span className="het-ertek">{aktualiso}</span>
      </div>
      <button className="btn-het-nav" onClick={() => hetLeptetes(1)} title="Következő hét">
        ▶
      </button>
      <button className="btn-ma" onClick={() => hetValtozas(aktHetSzamitas())} title="Aktuális hét">
        Ma
      </button>
    </div>
  );
}

export default HetValaszto;
