import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

function CsereKezelo() {
  const { user, token, isHR } = useContext(AuthContext);
  const [kerelmek, setKerelmek] = useState([]);
  const [betoltes, setBetoltes] = useState(false);

  useEffect(() => {
    betoltesKezelese();
  }, []);

  const betoltesKezelese = async () => {
    try {
      setBetoltes(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/csere`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const adat = await response.json();
      setKerelmek(adat);
    } catch (e) {
      console.error(e);
    } finally {
      setBetoltes(false);
    }
  };

  const statuszValtas = async (id, ujStatusz) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/csere/${id}/statusz`, {
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

  const szurtKerelmek = isHR ? kerelmek : kerelmek.filter(k => k.kezdemenyezoId === user.id || k.celtolgozoId === user.id);

  return (
    <div className="csere-container" style={{maxWidth:'800px', margin:'0 auto'}}>
      <h2>🔄 Műszakcserék</h2>
      <p style={{color:'#64748b', marginBottom:'20px'}}>Itt láthatod a leadott műszakcsere kérelmeket.</p>
      
      {betoltes ? <p>Betöltés...</p> : (
        <div style={{display:'grid', gap:'15px'}}>
          {szurtKerelmek.map(k => (
            <div key={k.id} className="card" style={{
              padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center',
              borderLeft: `5px solid ${k.statusz === 'Jovahagyva' ? '#10b981' : k.statusz === 'Elutasitva' ? '#ef4444' : '#4f46e5'}`
            }}>
              <div>
                <div style={{fontWeight:'700'}}>Műszak: {k.nap}</div>
                <div style={{fontSize:'0.8rem', color:'#64748b'}}>Státusz: {k.statusz}</div>
                <div style={{fontSize:'0.8rem', marginTop:'5px'}}>Kezdeményezte: {k.kezdemenyezoId === user.id ? "Te" : "Egyik kolléga"}</div>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                {isHR && k.statusz === 'Fuggoben' && (
                  <>
                    <button onClick={() => statuszValtas(k.id, 'Jovahagyva')} className="btn-success" style={{fontSize:'0.7rem', padding:'5px 10px'}}>Jóváhagyom</button>
                    <button onClick={() => statuszValtas(k.id, 'Elutasitva')} className="btn-danger" style={{fontSize:'0.7rem', padding:'5px 10px'}}>Elutasítom</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {szurtKerelmek.length === 0 && <p style={{textAlign:'center', color:'#94a3b8'}}>Nincs aktív csere kérelem.</p>}
        </div>
      )}
    </div>
  );
}

export default CsereKezelo;
