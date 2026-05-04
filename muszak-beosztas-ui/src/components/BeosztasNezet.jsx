// Beosztás nézet komponens - heti naptár grid megjelenítés
import { useState, useEffect, useContext, useMemo } from "react";
import { hetiBeosztasLekerdezese, beosztasGeneralasa, beosztasVeglegesitese, beosztasModositasa } from "../services/beosztasService";
import { AuthContext } from "../contexts/AuthContext";
import HetValaszto from "./HetValaszto";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
  const [localReszletek, setLocalReszletek] = useState([]);
  const [betoltes, setBetoltes] = useState(false);
  const [generalas, setGeneralas] = useState(false);
  const [mentesFolyamatban, setMentesFolyamatban] = useState(false);
  const [vanModositas, setVanModositas] = useState(false);
  const [hibaUzenet, setHibaUzenet] = useState("");
  const [kvotaSortBy, setKvotaSortBy] = useState("nev"); // "nev" | "pozicio" | "maradt"

  const napok = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

  useEffect(() => { beosztasBetoltese(); }, [het]);

  useEffect(() => {
    if (beosztas?.reszletek) {
      setLocalReszletek([...beosztas.reszletek]);
      setVanModositas(false);
    } else {
      setLocalReszletek([]);
    }
  }, [beosztas]);

  const beosztasBetoltese = async () => {
    try {
      setBetoltes(true); setHibaUzenet("");
      const adat = await hetiBeosztasLekerdezese(het);
      setBeosztas(adat);
    } catch { setHibaUzenet("Hiba a beosztás betöltésekor."); }
    finally { setBetoltes(false); }
  };

  const beosztasGeneralasKezelese = async () => {
    try {
      setGeneralas(true); setHibaUzenet("");
      await beosztasGeneralasa(het);
      await beosztasBetoltese();
    } catch { setHibaUzenet("Hiba a generálásnál."); }
    finally { setGeneralas(false); }
  };

  const veglegesitesKezelese = async () => {
    if (!beosztas?.id) return;
    if (!window.confirm("Biztosan publikálod? A dolgozók ezután látják a beosztásukat.")) return;
    try { await beosztasVeglegesitese(beosztas.id); await beosztasBetoltese(); }
    catch { setHibaUzenet("Hiba a publikálás során."); }
  };

  const modositasMentese = async () => {
    if (!beosztas?.id) return;
    try {
      setMentesFolyamatban(true);
      await beosztasModositasa(beosztas.id, localReszletek);
      await beosztasBetoltese(); setVanModositas(false);
    } catch { setHibaUzenet("Hiba a mentésnél."); }
    finally { setMentesFolyamatban(false); }
  };

  const handleExportCSV = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/export/csv/${het}`;
  };
  const handleExportICal = () => {
    if (user?.id) window.location.href = `${import.meta.env.VITE_API_URL}/api/export/ical/${het}/${user.id}`;
  };

  // ── Segédfüggvények ──
  const dolgozoMap = useMemo(() => {
    const map = {};
    dolgozok.forEach(d => { map[d.id] = d; });
    return map;
  }, [dolgozok]);

  const dolgozoAdat = (id) => {
    const d = dolgozoMap[id];
    return d ? { nev: d.nev, pozicio: d.pozicio || "", maxOra: d.maxHetiOra || 40 } : { nev: "?", pozicio: "", maxOra: 40 };
  };

  const pozicioIkon = (poz) => {
    if (!poz) return "👤";
    const p = poz.toLowerCase();
    if (p.includes("szakács")) return "👨‍🍳";
    if (p.includes("pincér")) return "🍽️";
    if (p.includes("pultos")) return "🍸";
    if (p.includes("vegyes")) return "🔄";
    return "👤";
  };

  const pozSzin = (poz) => {
    if (!poz) return { bg: "#e0e0e0", text: "#666" };
    const p = poz.toLowerCase();
    if (p.includes("szakács")) return { bg: "#fff3e0", text: "#e65100" };
    if (p.includes("pincér")) return { bg: "#e8f5e9", text: "#2e7d32" };
    if (p.includes("pultos")) return { bg: "#e3f2fd", text: "#1565c0" };
    if (p.includes("vegyes")) return { bg: "#f3e5f5", text: "#7b1fa2" };
    return { bg: "#e0e0e0", text: "#666" };
  };

  // Műszak órahosszának kiszámítása
  const muszakOrak = (m) => {
    if (!m?.kezdes || !m?.befejezes) return 8;
    const [kO, kP] = m.kezdes.split(":").map(Number);
    const [bO, bP] = m.befejezes.split(":").map(Number);
    let diff = (bO * 60 + bP) - (kO * 60 + kP);
    if (diff <= 0) diff += 24 * 60;
    return Math.round(diff / 60);
  };

  // ── Kvóta számítás ──
  const kvotaAdatok = useMemo(() => {
    const orak = {};
    dolgozok.forEach(d => { orak[d.id] = 0; });
    localReszletek.forEach(r => {
      const m = muszakok.find(m => m.id === r.muszakId);
      if (m && orak[r.dolgozoId] !== undefined) {
        orak[r.dolgozoId] += muszakOrak(m);
      }
    });
    return dolgozok
      .filter(d => d.szerepkor !== "HR" && d.pozicio !== "HR")
      .map(d => ({
        id: d.id,
        nev: d.nev,
        pozicio: d.pozicio,
        maxOra: d.maxHetiOra || 40,
        beosztottOra: orak[d.id] || 0,
        maradtOra: (d.maxHetiOra || 40) - (orak[d.id] || 0),
        szazalek: Math.round(((orak[d.id] || 0) / (d.maxHetiOra || 40)) * 100)
      }));
  }, [dolgozok, localReszletek, muszakok]);

  const rendezettKvota = useMemo(() => {
    const arr = [...kvotaAdatok];
    if (kvotaSortBy === "nev") arr.sort((a, b) => a.nev.localeCompare(b.nev, "hu"));
    if (kvotaSortBy === "pozicio") arr.sort((a, b) => a.pozicio.localeCompare(b.pozicio, "hu"));
    if (kvotaSortBy === "maradt") arr.sort((a, b) => b.maradtOra - a.maradtOra);
    return arr;
  }, [kvotaAdatok, kvotaSortBy]);

  // ── Műszakok rendezése időrend szerint ──
  const muszakSorrend = (m) => {
    if (!m?.kezdes) return 0;
    const [o, p] = m.kezdes.split(":").map(Number);
    return o * 60 + p;
  };

  // ── Naptár struktúra ──
  const naptarAdatok = () => {
    const grid = {};
    napok.forEach(nap => {
      const napiMuszakok = muszakok
        .filter(m => m.nap === nap)
        .sort((a, b) => muszakSorrend(a) - muszakSorrend(b)); // Időrend!
      grid[nap] = napiMuszakok.map(m => ({
        muszak: m,
        assigned: localReszletek.filter(r => r.nap === nap && r.muszakId === m.id)
      }));
    });
    return grid;
  };

  const grid = naptarAdatok();
  const isDragEnabled = isHR && beosztas?.allapot !== "Végleges";

  // ── Drag & Drop ──
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const fromSidebar = source.droppableId === "kvota-sidebar";
    const toSidebar = destination.droppableId === "kvota-sidebar";
    const dolgozoId = draggableId.split("_")[0];

    if (fromSidebar) {
      // Sidebar → Shift: hozzáadjuk
      const [destNap, destMuszakId] = destination.droppableId.split("_");
      const ujReszlet = { dolgozoId, muszakId: destMuszakId, nap: destNap };
      setLocalReszletek(prev => [...prev, ujReszlet]);
      setVanModositas(true);
    } else if (toSidebar) {
      // Shift → Sidebar: eltávolítás
      const [sourceNap, sourceMuszakId] = source.droppableId.split("_");
      setLocalReszletek(prev => prev.filter(r => !(r.dolgozoId === dolgozoId && r.nap === sourceNap && r.muszakId === sourceMuszakId)));
      setVanModositas(true);
    } else {
      // Shift → Shift: áthelyezés
      const [sourceNap, sourceMuszakId] = source.droppableId.split("_");
      const [destNap, destMuszakId] = destination.droppableId.split("_");
      const updated = localReszletek.map(r => {
        if (r.dolgozoId === dolgozoId && r.nap === sourceNap && r.muszakId === sourceMuszakId) {
          return { ...r, nap: destNap, muszakId: destMuszakId };
        }
        return r;
      });
      setLocalReszletek(updated);
      setVanModositas(true);
    }
  };

  // Statisztika
  const osszesSlot = muszakok.reduce((sum, m) => sum + (m.szuksegesLetszam || 1), 0);
  const betoltottSlot = localReszletek.length;

  return (
    <div className="beosztas-container">
      <div className="beosztas-fejlec">
        <h2>📊 Heti Beosztás {isHR && <span className="hr-badge">Szerkesztő Mód</span>}</h2>
        <HetValaszto het={het} hetValtozas={setHet} />
        <div className="beosztas-gombok">
          {beosztas && (
            <>
              <button className="btn-secondary" onClick={handleExportCSV}>📊 CSV</button>
              <button className="btn-secondary" onClick={handleExportICal}>📅 iCal</button>
            </>
          )}
          {isHR && (
            <>
              <button className="btn-general" onClick={beosztasGeneralasKezelese} disabled={generalas || vanModositas}>
                {generalas ? "⏳ Generálás..." : "⚡ Új Generálás"}
              </button>
              {vanModositas && (
                <button className="btn-mentes" onClick={modositasMentese} disabled={mentesFolyamatban}
                  style={{backgroundColor:'#28a745',color:'white',fontWeight:'bold'}}>
                  {mentesFolyamatban ? "⏳ Mentés..." : "💾 Mentés"}
                </button>
              )}
              {beosztas && beosztas.allapot !== "Végleges" && !vanModositas && (
                <button className="btn-veglegesit" onClick={veglegesitesKezelese}>📢 Publikálás</button>
              )}
            </>
          )}
        </div>
        {beosztas && (
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span className={`allapot-badge ${beosztas.allapot==="Végleges"?"vegleges":(vanModositas?"tervezet-modositva":"tervezet")}`}>
              {vanModositas ? "Módosítva (Mentetlen)" : beosztas.allapot==="Végleges" ? "✅ Publikált" : beosztas.allapot}
            </span>
            <span style={{fontSize:'0.85rem',color:'#666'}}>{betoltottSlot}/{osszesSlot} pozíció</span>
          </div>
        )}
      </div>

      {hibaUzenet && <div className="hiba-banner">{hibaUzenet}</div>}

      {betoltes ? (
        <p className="betoltes">⏳ Betöltés...</p>
      ) : !beosztas ? (
        <div className="ures-lista">
          <p>📋 Nincs beosztás erre a hétre.</p>
          {isHR && <p>Kattints az "Új Generálás" gombra!</p>}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{display:'flex',gap:'16px'}}>
            {/* ═══ KVÓTA SIDEBAR ═══ */}
            {isHR && (
              <div style={{
                width:'260px',minWidth:'260px',
                backgroundColor:'#f8f9fa',borderRadius:'12px',padding:'12px',
                border:'1px solid #dee2e6',maxHeight:'80vh',overflowY:'auto',
                position:'sticky',top:'20px'
              }}>
                <h3 style={{margin:'0 0 8px',fontSize:'0.95rem',color:'#495057'}}>
                  👥 Heti kvóta
                </h3>
                <div style={{display:'flex',gap:'4px',marginBottom:'10px',flexWrap:'wrap'}}>
                  {[{k:"nev",l:"Név"},{k:"pozicio",l:"Pozíció"},{k:"maradt",l:"Szabad"}].map(({k,l})=>(
                    <button key={k} onClick={()=>setKvotaSortBy(k)}
                      style={{
                        padding:'3px 8px',fontSize:'0.7rem',borderRadius:'6px',border:'1px solid #ccc',
                        backgroundColor:kvotaSortBy===k?'#4a90e2':'white',
                        color:kvotaSortBy===k?'white':'#666',cursor:'pointer',fontWeight:'600'
                      }}>{l}</button>
                  ))}
                </div>
                <Droppable droppableId="kvota-sidebar" isDropDisabled={!isDragEnabled}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {rendezettKvota.map((d, i) => {
                        const pSzin = pozSzin(d.pozicio);
                        const teljes = d.maradtOra <= 0;
                        return (
                          <Draggable draggableId={`${d.id}_sidebar`} index={i} key={d.id}
                            isDragDisabled={!isDragEnabled}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                style={{
                                  ...prov.draggableProps.style,
                                  padding:'8px 10px',marginBottom:'6px',
                                  backgroundColor:snap.isDragging?'#e3f2fd':teljes?'#f5f5f5':'white',
                                  borderRadius:'8px',border:'1px solid #e0e0e0',
                                  cursor:isDragEnabled?'grab':'default',
                                  opacity:teljes?0.5:1,
                                  boxShadow:snap.isDragging?'0 4px 12px rgba(0,0,0,0.15)':'0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                                  <span style={{fontSize:'0.9rem'}}>{pozicioIkon(d.pozicio)}</span>
                                  <span style={{fontWeight:'600',fontSize:'0.8rem',color:'#333',flex:1}}>{d.nev}</span>
                                  <span style={{
                                    fontSize:'0.65rem',padding:'1px 6px',borderRadius:'8px',
                                    backgroundColor:pSzin.bg,color:pSzin.text,fontWeight:'600'
                                  }}>{d.pozicio}</span>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                  <div style={{
                                    flex:1,height:'6px',backgroundColor:'#e0e0e0',borderRadius:'3px',overflow:'hidden'
                                  }}>
                                    <div style={{
                                      width:`${Math.min(d.szazalek,100)}%`,height:'100%',
                                      backgroundColor:d.szazalek>=100?'#4caf50':d.szazalek>=60?'#ff9800':'#f44336',
                                      borderRadius:'3px',transition:'width 0.3s'
                                    }}/>
                                  </div>
                                  <span style={{fontSize:'0.65rem',color:'#888',minWidth:'50px',textAlign:'right'}}>
                                    {d.beosztottOra}/{d.maxOra}h
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}

            {/* ═══ NAPTÁR GRID ═══ */}
            <div className="naptar-grid" style={{flex:1}}>
              {napok.map(nap => (
                <div key={nap} className="naptar-oszlop">
                  <div className="naptar-fejlec">{nap}</div>
                  <div className="naptar-cellak">
                    {grid[nap].map(slot => {
                      const m = slot.muszak;
                      const droppableId = `${nap}_${m.id}`;
                      const teljes = slot.assigned.length >= m.szuksegesLetszam;
                      
                      return (
                        <Droppable droppableId={droppableId} key={droppableId} isDropDisabled={!isDragEnabled}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}
                              style={{
                                minHeight:'80px',padding:'10px',marginBottom:'8px',
                                borderRadius:'8px',
                                border: snapshot.isDraggingOver ? '2px dashed #4a90e2' :
                                  teljes ? '1px solid #c8e6c9' : '1px solid #ffcdd2',
                                backgroundColor: snapshot.isDraggingOver ? '#e8f0fe' :
                                  teljes ? '#f1f8e9' : '#fff8f8'
                              }}>
                              <div style={{marginBottom:'6px'}}>
                                <div style={{fontWeight:'700',fontSize:'0.85rem',color:'#333'}}>{m.megnevezes}</div>
                                <div style={{fontSize:'0.75rem',color:'#888'}}>🕐 {m.kezdes} – {m.befejezes}</div>
                                <div style={{
                                  fontSize:'0.7rem',fontWeight:'700',
                                  color:teljes?'#2e7d32':'#d32f2f'
                                }}>
                                  {slot.assigned.length}/{m.szuksegesLetszam} fő
                                  {m.pozicio && <span style={{color:'#999',fontWeight:'400'}}> · {m.pozicio}</span>}
                                </div>
                              </div>

                              <div style={{minHeight:'20px'}}>
                                {slot.assigned.map((r, idx) => {
                                  const da = dolgozoAdat(r.dolgozoId);
                                  const ps = pozSzin(da.pozicio);
                                  return (
                                    <Draggable draggableId={`${r.dolgozoId}_${nap}_${m.id}`} index={idx}
                                      key={`${r.dolgozoId}_${nap}_${m.id}`} isDragDisabled={!isDragEnabled}>
                                      {(prov, snap) => (
                                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                          style={{
                                            ...prov.draggableProps.style,
                                            padding:'4px 8px',margin:'3px 0',
                                            backgroundColor:snap.isDragging?'#e3f2fd':'white',
                                            borderRadius:'6px',border:'1px solid #e0e0e0',
                                            boxShadow:snap.isDragging?'0 4px 8px rgba(0,0,0,0.15)':'0 1px 2px rgba(0,0,0,0.05)',
                                            cursor:isDragEnabled?'grab':'default',
                                            display:'flex',alignItems:'center',gap:'5px',fontSize:'0.8rem'
                                          }}>
                                          <span>{pozicioIkon(da.pozicio)}</span>
                                          <span style={{fontWeight:'600',flex:1}}>{da.nev}</span>
                                          <span style={{
                                            fontSize:'0.6rem',padding:'1px 5px',borderRadius:'6px',
                                            backgroundColor:ps.bg,color:ps.text,fontWeight:'600'
                                          }}>{da.pozicio}</span>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                                {slot.assigned.length === 0 && (
                                  <div style={{textAlign:'center',color:'#ccc',fontStyle:'italic',fontSize:'0.7rem',padding:'4px'}}>
                                    Üres
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

export default BeosztasNezet;
