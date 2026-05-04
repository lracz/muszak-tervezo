// Beosztás nézet komponens - heti naptár grid megjelenítés
import { useState, useEffect, useContext, useMemo } from "react";
import { hetiBeosztasLekerdezese, beosztasGeneralasa, beosztasVeglegesitese, beosztasModositasa } from "../services/beosztasService";
import { AuthContext } from "../contexts/AuthContext";
import HetValaszto from "./HetValaszto";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function BeosztasNezet({ dolgozok, muszakok }) {
  const { user, token, isHR } = useContext(AuthContext);
  
  const [csereModal, setCsereModal] = useState(null); // { nap, muszakId, kezdemenyezoId }
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
  const [hibaUzenet, setHibaUzenet] = useState(null);
  const [sikerUzenet, setSikerUzenet] = useState(null);
  const [sidebarNyitva, setSidebarNyitva] = useState(true);
  const [kvotaSortBy, setKvotaSortBy] = useState("maradt"); // nev, pozicio, maradt

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
      setGeneralas(true);
      setHibaUzenet(null);
      await beosztasGeneralasa(het);
      await beosztasBetoltese();
      setSikerUzenet("Beosztás sikeresen generálva!");
      setTimeout(() => setSikerUzenet(null), 3000);
    } catch (error) {
      setHibaUzenet("Hiba a generálásnál."); }
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
      setHibaUzenet(null);
      await beosztasModositasa(beosztas.id, localReszletek);
      await beosztasBetoltese(); 
      setVanModositas(false);
      setSikerUzenet("Módosítások elmentve!");
      setTimeout(() => setSikerUzenet(null), 3000);
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

  const kapacitasInfo = useMemo(() => {
    if (!isHR) return null;
    const szuksegesOra = muszakok.reduce((acc, m) => acc + (muszakOrak(m) * m.szuksegesLetszam), 0);
    const elerhetoOra = dolgozok.filter(d => d.szerepkor !== "HR").reduce((acc, d) => acc + (d.maxHetiOra || 40), 0);
    const szuksegesSlots = muszakok.reduce((acc, m) => acc + m.szuksegesLetszam, 0);
    const filledSlots = localReszletek.length;
    
    // Bérköltség számítás
    let osszesKoltseg = 0;
    localReszletek.forEach(r => {
      const d = dolgozoMap[r.dolgozoId];
      const m = muszakok.find(m => m.id === r.muszakId);
      if (d && m) {
        osszesKoltseg += muszakOrak(m) * (d.oraber || 2500);
      }
    });
    
    return {
      szuksegesOra,
      elerhetoOra,
      hianyOra: szuksegesOra - elerhetoOra,
      uresSlotok: szuksegesSlots - filledSlots,
      tultermeles: elerhetoOra > szuksegesOra * 1.3,
      osszesKoltseg
    };
  }, [muszakok, dolgozok, localReszletek, isHR, dolgozoMap]);

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
        assigned: localReszletek
          .filter(r => r.nap === nap && r.muszakId === m.id)
          .sort((a, b) => {
            const da = dolgozoAdat(a.dolgozoId);
            const db = dolgozoAdat(b.dolgozoId);
            return da.nev.localeCompare(db.nev, "hu");
          })
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
      <div className="beosztas-fejlec" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <div className="beosztas-cim">
          <h2 style={{display:'flex', alignItems:'center', gap:'10px', margin:0}}>
            🗓️ Heti Beosztás Tervező
          </h2>
        </div>

        {isHR && kapacitasInfo && (
          <div className="kapacitas-panel" style={{marginBottom:0, padding:'10px 20px'}}>
            <div className="kapacitas-box">
              <div className="kapacitas-cimke">LEFEDETTSÉG</div>
              <div className="kapacitas-ertek" style={{fontSize:'1rem', color: kapacitasInfo.uresSlotok > 0 ? '#ef4444' : '#10b981'}}>
                {kapacitasInfo.uresSlotok === 0 ? '✅ 100%' : `⚠️ ${kapacitasInfo.uresSlotok} hely`}
              </div>
            </div>
            <div className="kapacitas-box">
              <div className="kapacitas-cimke">IGÉNY</div>
              <div className="kapacitas-ertek" style={{fontSize:'1rem'}}>
                {kapacitasInfo.hianyOra > 0 ? <span style={{color:'#ef4444'}}>🛑 Hiány</span> : kapacitasInfo.tultermeles ? <span style={{color:'#f59e0b'}}>📢 Túl sok</span> : <span style={{color:'#10b981'}}>💎 Optimális</span>}
              </div>
            </div>
            <div className="kapacitas-box">
              <div className="kapacitas-cimke">KÖLTSÉG</div>
              <div className="kapacitas-ertek" style={{fontSize:'1rem', color: '#4f46e5'}}>
                {new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(kapacitasInfo.osszesKoltseg)}
              </div>
            </div>
            {kapacitasInfo.tultermeles && (
              <div className="javaslat-box" style={{color:'#f59e0b', fontSize:'0.75rem', borderLeft:'1px solid #eee', paddingLeft:'15px'}}>
                ⚠️ Csökkentse a létszámot!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="beosztas-toolbar-container" style={{marginBottom:'20px'}}>
        <div className="beosztas-gombok">
          <HetValaszto het={het} hetValtozas={setHet} />
          
          <div style={{display:'flex', gap:'10px', marginLeft:'20px', borderLeft:'1px solid #ddd', paddingLeft:'20px'}}>
            {beosztas && (
              <>
                <button className="btn-secondary hover-lift" onClick={handleExportCSV}>📊 CSV</button>
                <button className="btn-secondary hover-lift" onClick={handleExportICal}>📅 iCal</button>
              </>
            )}
            {isHR && (
              <>
                <button className={`btn-secondary hover-lift ${sidebarNyitva ? 'active' : ''}`} onClick={() => setSidebarNyitva(!sidebarNyitva)}>
                  {sidebarNyitva ? "🙈 Kvóta" : "👥 Kvóta"}
                </button>
                <button className="btn-general hover-lift" onClick={beosztasGeneralasKezelese} disabled={generalas || vanModositas}>
                  {generalas ? "⏳ ..." : "⚡ Generálás"}
                </button>
                {vanModositas && (
                  <button className="btn-mentes hover-lift" onClick={modositasMentese} disabled={mentesFolyamatban}>
                    {mentesFolyamatban ? "⏳ ..." : "💾 Mentés"}
                  </button>
                )}
                {beosztas && beosztas.allapot !== "Végleges" && !vanModositas && (
                  <button className="btn-veglegesit hover-lift" onClick={veglegesitesKezelese}>📢 Publikálás</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {hibaUzenet && <div className="error-msg" style={{padding:'10px',backgroundColor:'#ffebee',color:'#c62828',borderRadius:'8px',marginBottom:'15px',border:'1px solid #ef9a9a'}}>⚠️ {hibaUzenet}</div>}
      {sikerUzenet && <div className="success-msg" style={{padding:'10px',backgroundColor:'#e8f5e9',color:'#2e7d32',borderRadius:'8px',marginBottom:'15px',border:'1px solid #a5d6a7'}}>✅ {sikerUzenet}</div>}

      {beosztas && (
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span className={`allapot-badge ${beosztas.allapot==="Végleges"?"vegleges":(vanModositas?"tervezet-modositva":"tervezet")}`}>
            {vanModositas ? "Módosítva (Mentetlen)" : beosztas.allapot==="Végleges" ? "✅ Publikált" : beosztas.allapot}
          </span>
          <span style={{fontSize:'0.85rem',color:'#666'}}>{betoltottSlot}/{osszesSlot} pozíció</span>
        </div>
      )}

      {betoltes ? (
        <div className="naptar-grid">
          {Array(7).fill(null).map((_, i) => (
            <div key={i} className="naptar-oszlop">
              <div className="naptar-fejlec skeleton" style={{height:'40px'}}></div>
              <div className="naptar-cellak">
                <div className="skeleton" style={{height:'100px', marginBottom:'10px'}}></div>
                <div className="skeleton" style={{height:'80px'}}></div>
              </div>
            </div>
          ))}
        </div>
      ) : !beosztas ? (
        <div className="ures-lista">
          <p>📋 Nincs beosztás erre a hétre.</p>
          {isHR && <p>Kattints az "Új Generálás" gombra!</p>}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="beosztas-belso" style={{display:'flex',gap:'20px',alignItems:'flex-start'}}>
            {/* ═══ KVÓTA SIDEBAR ═══ */}
            {isHR && sidebarNyitva && (
              <div className="kvota-sidebar" style={{
                width:'280px',backgroundColor:'#f8f9fa',padding:'15px',borderRadius:'12px',
                border:'1px solid #e0e0e0',position:'sticky',top:'20px',maxHeight:'85vh',overflowY:'auto'
              }}>
                <div style={{marginBottom:'15px'}}>
                  <h3 style={{fontSize:'1rem',marginBottom:'10px',color:'#2c3e50'}}>👥 Dolgozói kvóta</h3>
                  <div style={{display:'flex',gap:'5px',marginBottom:'10px'}}>
                    {[{k:"nev",l:"Név"},{k:"pozicio",l:"Pozíció"},{k:"maradt",l:"Hátralék"}].map(({k,l})=>(
                      <button key={k} onClick={()=>setKvotaSortBy(k)}
                        style={{
                          padding:'3px 8px',fontSize:'0.7rem',borderRadius:'4px',border:'1px solid #ddd',
                          backgroundColor:kvotaSortBy===k?'#4a90e2':'white',
                          color:kvotaSortBy===k?'white':'#666',cursor:'pointer',fontWeight:'600'
                        }}>{l}</button>
                    ))}
                  </div>
                  <p style={{fontSize:'0.75rem',color:'#666'}}>Húzd a dolgozókat a műszakokba!</p>
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
                                      const isSajat = r.dolgozoId === user?.id;
                                      
                                      return (
                                        <Draggable draggableId={`${r.dolgozoId}_${nap}_${m.id}`} index={idx}
                                          key={`${r.dolgozoId}_${nap}_${m.id}`} isDragDisabled={!isDragEnabled}>
                                          {(prov, snap) => (
                                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                              className="hover-lift animate-in"
                                              style={{
                                                ...prov.draggableProps.style,
                                                padding:'6px 10px',margin:'4px 0',
                                                backgroundColor:snap.isDragging?'#e3f2fd':isSajat?'#fff9c4':'white',
                                                borderRadius:'12px',
                                                border: isSajat ? '2px solid #fbc02d' : '1px solid var(--glass-border)',
                                                boxShadow:snap.isDragging?'0 8px 16px rgba(0,0,0,0.15)':isSajat?'0 4px 12px rgba(251,192,45,0.3)':'0 2px 4px rgba(0,0,0,0.05)',
                                                cursor:isDragEnabled?'grab':'default',
                                                display:'flex',alignItems:'center',gap:'8px',fontSize:'0.85rem',
                                                transition:'all 0.3s ease',
                                                animationDelay: `${idx * 0.1 + (napok.indexOf(nap) * 0.05)}s`
                                              }}>
                                            <span>{pozicioIkon(da.pozicio)}</span>
                                            <span style={{fontWeight:isSajat?'800':'600',flex:1,color:isSajat?'#f57f17':'#334155'}}>{da.nev} {isSajat && "(Te)"}</span>
                                            {isSajat ? (
                                              <div style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                                <button 
                                                  onClick={() => setCsereModal({ nap, muszakId: m.id, kezdemenyezoId: user.id })}
                                                  className="btn-swap-mini"
                                                  title="Csere kérése"
                                                >🔄</button>
                                                <span style={{
                                                  fontSize:'0.6rem',padding:'2px 6px',borderRadius:'10px',
                                                  backgroundColor:'#fbc02d',color:'white',fontWeight:'900',
                                                  textTransform:'uppercase',letterSpacing:'0.5px'
                                                }}>Saját</span>
                                              </div>
                                            ) : (
                                              <span style={{
                                                fontSize:'0.65rem',padding:'2px 6px',borderRadius:'6px',
                                                backgroundColor:ps.bg,color:ps.text,fontWeight:'600'
                                              }}>{da.pozicio}</span>
                                            )}
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
      {csereModal && (
        <div className="modal-backdrop" onClick={() => setCsereModal(null)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()}>
            <h3>🔄 Kivel szeretnél cserélni?</h3>
            <p style={{fontSize:'0.9rem', color:'#666', marginBottom:'15px'}}>
              Válaszd ki azt a kollégát, akinek felajánlod a műszakodat a <strong>{csereModal.nap}i</strong> napon.
            </p>
            <div className="partner-lista" style={{maxHeight:'300px', overflowY:'auto', display:'grid', gap:'10px'}}>
              {dolgozok.filter(d => d.id !== user.id && d.szerepkor !== "HR").map(d => (
                <button
                  key={d.id}
                  className="partner-item"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/csere`, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                          kezdemenyezoId: user.id,
                          partnerId: d.id,
                          muszakId: csereModal.muszakId,
                          nap: csereModal.nap,
                          statusz: "Fuggoben"
                        })
                      });
                      if (res.ok) {
                        alert("Csere kérelem sikeresen elküldve " + d.nev + " részére!");
                        setCsereModal(null);
                      } else {
                        alert("Hiba történt a kérelem küldésekor.");
                      }
                    } catch (err) {
                      alert("Hálózati hiba.");
                    }
                  }}
                  style={{
                    display:'flex', alignItems:'center', gap:'10px', padding:'12px',
                    border:'1px solid #eee', borderRadius:'8px', background:'white', cursor:'pointer',
                    textAlign:'left', transition:'all 0.2s'
                  }}
                >
                  <span style={{fontSize:'1.2rem'}}>{pozicioIkon(d.pozicio)}</span>
                  <div>
                    <div style={{fontWeight:'700'}}>{d.nev}</div>
                    <div style={{fontSize:'0.75rem', color:'#888'}}>{d.pozicio}</div>
                  </div>
                </button>
              ))}
            </div>
            <button className="btn-torles" style={{marginTop:'20px', width:'100%'}} onClick={() => setCsereModal(null)}>Mégse</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BeosztasNezet;
