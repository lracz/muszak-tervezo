import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import ModernDatePicker from "./ModernDatePicker";

function SzabadsagKezelo() {
  const { user, token, isHR } = useContext(AuthContext);
  const [szabadsagok, setSzabadsagok] = useState([]);
  const [mettol, setMettol] = useState("");
  const [meddig, setMeddig] = useState("");
  const [indok, setIndok] = useState("");
  const [betoltes, setBetoltes] = useState(false);
  const [mentes, setMentes] = useState(false);

  useEffect(() => {
    betoltesKezelese();
  }, []);

  const betoltesKezelese = async () => {
    try {
      setBetoltes(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/szabadsag`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const adat = await response.json();
      setSzabadsagok(adat);
    } catch (e) {
      console.error(e);
    } finally {
      setBetoltes(false);
    }
  };

  const ujkerelemBekuldese = async (e) => {
    e.preventDefault();
    if (!mettol || !meddig) return alert("Dátumok megadása kötelező!");
    
    try {
      setMentes(true);
      const uj = {
        dolgozoId: user.id,
        mettol: new Date(mettol).toISOString(),
        meddig: new Date(meddig).toISOString(),
        indoklas: indok,
        statusz: "Fuggoben"
      };
      
      await fetch(`${import.meta.env.VITE_API_URL}/api/szabadsag`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(uj)
      });
      
      setMettol(""); setMeddig(""); setIndok("");
      await betoltesKezelese();
    } catch (e) {
      alert("Hiba a mentésnél!");
    } finally {
      setMentes(false);
    }
  };

  const statuszValtas = async (id, ujStatusz) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/szabadsag/${id}/statusz`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(ujStatusz)
      });
      await betoltesKezelese();
    } catch (e) {
      alert("Hiba a frissítésnél!");
    }
  };

  const torles = async (id) => {
    if (!window.confirm("Biztosan törlöd?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/szabadsag/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await betoltesKezelese();
    } catch (e) {
      alert("Hiba a törlésnél!");
    }
  };

  const szurtSzabadsagok = isHR ? szabadsagok : szabadsagok.filter(s => s.dolgozoId === user?.id);
  const ma = new Date().toISOString().split("T")[0];
  const ketEvMulva = new Date();
  ketEvMulva.setFullYear(ketEvMulva.getFullYear() + 2);
  const maxDatum = ketEvMulva.toISOString().split("T")[0];

  return (
    <div className="szabadsag-container" style={{maxWidth:'800px', margin:'0 auto'}}>
      <div className="form-container" style={{marginBottom:'30px'}}>
        <h2>🏖️ Új szabadság igénylése</h2>
        <form onSubmit={ujkerelemBekuldese} style={{display:'grid', gap:'20px', gridTemplateColumns:'1fr 1fr'}}>
          <ModernDatePicker 
            label="Mettől"
            value={mettol}
            min={ma}
            max={maxDatum}
            onChange={setMettol}
          />
          <ModernDatePicker 
            label="Meddig"
            value={meddig}
            min={mettol || ma}
            max={maxDatum}
            onChange={setMeddig}
          />
          <div className="form-mezo" style={{gridColumn:'span 2'}}>
            <label>Indoklás (opcionális)</label>
            <textarea value={indok} onChange={e => setIndok(e.target.value)} placeholder="Pl. Családi esemény" />
          </div>
          <button type="submit" className="btn-mentes" style={{gridColumn:'span 2'}} disabled={mentes}>
            {mentes ? "Mentés..." : "🚀 Kérelem beküldése"}
          </button>
        </form>
      </div>

      <div className="lista-container">
        <h3>📋 {isHR ? "Összes kérelem" : "Saját kérelmeid"}</h3>
        {betoltes ? <p>Betöltés...</p> : (
          <div style={{display:'grid', gap:'15px'}}>
            {szurtSzabadsagok.map(s => (
              <div key={s.id} className="card" style={{
                padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center',
                borderLeft: `5px solid ${s.statusz === 'Jovahagyva' ? '#10b981' : s.statusz === 'Elutasitva' ? '#ef4444' : '#f59e0b'}`
              }}>
                <div>
                  <div style={{fontWeight:'700'}}>{new Date(s.mettol).toLocaleDateString()} - {new Date(s.meddig).toLocaleDateString()}</div>
                  <div style={{fontSize:'0.8rem', color:'#64748b'}}>{s.tipus} · {s.statusz}</div>
                  {s.indoklas && <div style={{fontSize:'0.9rem', marginTop:'5px', fontStyle:'italic'}}>"{s.indoklas}"</div>}
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                  {isHR && s.statusz === 'Fuggoben' && (
                    <>
                      <button onClick={() => statuszValtas(s.id, 'Jovahagyva')} className="btn-success" style={{fontSize:'0.7rem', padding:'5px 10px'}}>Pipa</button>
                      <button onClick={() => statuszValtas(s.id, 'Elutasitva')} className="btn-danger" style={{fontSize:'0.7rem', padding:'5px 10px'}}>X</button>
                    </>
                  )}
                  <button onClick={() => torles(s.id)} style={{background:'none', border:'none', cursor:'pointer'}}>🗑️</button>
                </div>
              </div>
            ))}
            {szurtSzabadsagok.length === 0 && <p style={{textAlign:'center', color:'#94a3b8'}}>Nincs megjeleníthető kérelem.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default SzabadsagKezelo;
