// Beosztás nézet komponens - heti naptár grid megjelenítés
import { useState, useEffect, useContext } from "react";
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

  const napok = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];

  useEffect(() => {
    beosztasBetoltese();
  }, [het]);

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
    if (!window.confirm("Biztosan véglegesíted a beosztást? A művelet nem visszavonható.")) return;
    try {
      await beosztasVeglegesitese(beosztas.id);
      await beosztasBetoltese();
    } catch (hiba) {
      setHibaUzenet("Hiba a véglegesítés során.");
    }
  };

  const modositasMentese = async () => {
    if (!beosztas?.id) return;
    try {
      setMentesFolyamatban(true);
      await beosztasModositasa(beosztas.id, localReszletek);
      await beosztasBetoltese();
      setVanModositas(false);
    } catch (hiba) {
      setHibaUzenet("Hiba a módosítás mentésekor.");
    } finally {
      setMentesFolyamatban(false);
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

  const dolgozoNev = (id) => {
    const d = dolgozok.find((d) => d.id === id);
    return d ? d.nev : "?";
  };

  const muszakClass = (megnevezes) => {
    if (!megnevezes) return "muszak-cell";
    const nev = megnevezes.toLowerCase();
    if (nev.includes("reggeli") || nev.includes("délelőtt")) return "muszak-cell muszak-reggeli";
    if (nev.includes("délutáni") || nev.includes("délután")) return "muszak-cell muszak-delutani";
    if (nev.includes("éjszakai") || nev.includes("éjszaka")) return "muszak-cell muszak-ejszakai";
    return "muszak-cell";
  };

  const onDragEnd = (result) => {
    if (!result.destination) return; // Dropped outside

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return; // Same shift, order doesn't matter here

    // Parse source and destination IDs
    // Format: "Nap_MuszakId"
    const [sourceNap, sourceMuszakId] = source.droppableId.split("_");
    const [destNap, destMuszakId] = destination.droppableId.split("_");
    const dolgozoId = draggableId.split("_")[0]; // "DolgozoId_RandId" -> DolgozoId

    // Remove from source shift and add to destination shift
    const updatedReszletek = localReszletek.map(r => {
      // Find the exact item that was dragged
      if (r.dolgozoId === dolgozoId && r.nap === sourceNap && r.muszakId === sourceMuszakId) {
        return { ...r, nap: destNap, muszakId: destMuszakId };
      }
      return r;
    });

    setLocalReszletek(updatedReszletek);
    setVanModositas(true);
  };

  // Naptár adatok strukturálása: Nap -> Műszak -> (Hozzárendelt dolgozók)
  const naptarAdatok = () => {
    const grid = {};
    napok.forEach((nap) => { 
      grid[nap] = muszakok.map(m => {
        // Find assigned workers for this specific day and shift
        const assigned = localReszletek.filter(r => r.nap === nap && r.muszakId === m.id);
        return {
          muszak: m,
          assigned: assigned
        };
      });
    });
    return grid;
  };

  const grid = naptarAdatok();
  const isDragEnabled = isHR && beosztas?.allapot !== "Végleges";

  return (
    <div className="beosztas-container">
      <div className="beosztas-fejlec">
        <h2>📊 Heti Beosztás {isHR && <span className="hr-badge">Szerkesztő Mód</span>}</h2>
        <HetValaszto het={het} hetValtozas={setHet} />
        
        <div className="beosztas-gombok">
          {beosztas && (
            <>
              <button className="btn-secondary" onClick={handleExportCSV} title="Táblázat kimentése">
                📊 CSV
              </button>
              <button className="btn-secondary" onClick={handleExportICal} title="Okostelefon Szinkronizálás">
                📅 iCal
              </button>
            </>
          )}

          {isHR && (
            <>
              <button className="btn-general" onClick={beosztasGeneralasKezelese} disabled={generalas || vanModositas}>
                {generalas ? "⏳ Generálás..." : "⚡ Új Generálás"}
              </button>
              
              {vanModositas && (
                <button className="btn-mentes" onClick={modositasMentese} disabled={mentesFolyamatban} style={{backgroundColor: '#28a745', color: 'white', fontWeight: 'bold'}}>
                  {mentesFolyamatban ? "⏳ Mentés..." : "💾 Módosítások Mentése"}
                </button>
              )}

              {beosztas && beosztas.allapot !== "Végleges" && !vanModositas && (
                <button className="btn-veglegesit" onClick={veglegesitesKezelese}>
                  ✅ Véglegesítés
                </button>
              )}
            </>
          )}
        </div>
        {beosztas && (
          <span className={`allapot-badge ${beosztas.allapot === "Végleges" ? "vegleges" : (vanModositas ? "tervezet-modositva" : "tervezet")}`}>
            {vanModositas ? "Módosítva (Mentetlen)" : beosztas.allapot}
          </span>
        )}
      </div>

      {hibaUzenet && <div className="hiba-banner">{hibaUzenet}</div>}

      {betoltes ? (
        <p className="betoltes">⏳ Beosztás betöltése...</p>
      ) : !beosztas ? (
        <div className="ures-lista">
          <p>📋 Nincs beosztás erre a hétre.</p>
          {isHR && <p>Kattints a "Új Generálás" gombra!</p>}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="naptar-grid">
            {napok.map((nap) => (
              <div key={nap} className="naptar-oszlop">
                <div className="naptar-fejlec">{nap}</div>
                <div className="naptar-cellak">
                  
                  {grid[nap].map((slot) => {
                    const m = slot.muszak;
                    const droppableId = `${nap}_${m.id}`;
                    
                    return (
                      <Droppable droppableId={droppableId} key={droppableId} isDropDisabled={!isDragEnabled}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`${muszakClass(m.megnevezes)} ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                            style={{ 
                              minHeight: '120px', 
                              border: snapshot.isDraggingOver ? '2px dashed #4a90e2' : '',
                              opacity: slot.assigned.length < m.szuksegesLetszam ? 0.8 : 1
                            }}
                          >
                            <div className="muszak-fejlec-info">
                              <span className="muszak-nev">{m.megnevezes}</span>
                              <span className="muszak-ido">{m.kezdes} - {m.befejezes}</span>
                              <span className="muszak-hiany" style={{fontSize: '0.75rem', color: '#666'}}>
                                {slot.assigned.length} / {m.szuksegesLetszam} fő
                              </span>
                            </div>

                            <div className="dolgozok-lista" style={{marginTop: '10px', minHeight: '30px'}}>
                              {slot.assigned.map((r, index) => {
                                const draggableId = `${r.dolgozoId}_${nap}_${m.id}`;
                                return (
                                  <Draggable draggableId={draggableId} index={index} key={draggableId} isDragDisabled={!isDragEnabled}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="dolgozo-kartyacska"
                                        style={{
                                          ...provided.draggableProps.style,
                                          padding: '8px',
                                          margin: '4px 0',
                                          backgroundColor: snapshot.isDragging ? '#e3f2fd' : 'white',
                                          borderRadius: '4px',
                                          boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                                          cursor: isDragEnabled ? 'grab' : 'default',
                                          display: 'flex',
                                          alignItems: 'center',
                                          fontWeight: 'bold',
                                          color: '#333',
                                          border: '1px solid #e0e0e0'
                                        }}
                                      >
                                        <span style={{marginRight: '8px'}}>👤</span>
                                        {dolgozoNev(r.dolgozoId)}
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                              
                              {slot.assigned.length === 0 && (
                                <div style={{textAlign: 'center', color: '#999', fontStyle: 'italic', fontSize: '0.8rem', padding: '10px 0'}}>
                                  Nincs beosztva senki
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
        </DragDropContext>
      )}
    </div>
  );
}

export default BeosztasNezet;
