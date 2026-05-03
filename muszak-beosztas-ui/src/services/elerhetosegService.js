// API szolgáltatás az elérhetőségek kezelésére
const API_URL = `${import.meta.env.VITE_API_URL}/api/elerhetoseg`;

// Összes elérhetőség lekérdezése
export async function elerhetosegekLekerdezese() {
  const valasz = await fetch(API_URL);
  if (!valasz.ok) throw new Error("Hiba az elérhetőségek lekérdezésekor");
  return await valasz.json();
}

// Egy dolgozó elérhetőségeinek lekérdezése
export async function dolgozoElerhetosegeiLekerdezese(dolgozoId) {
  const valasz = await fetch(`${API_URL}/dolgozo/${dolgozoId}`);
  if (!valasz.ok) throw new Error("Hiba az elérhetőségek lekérdezésekor");
  return await valasz.json();
}

// Új elérhetőség létrehozása
export async function elerhetosegLetrehozasa(elerhetoseg) {
  const valasz = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(elerhetoseg),
  });
  if (!valasz.ok) throw new Error("Hiba az elérhetőség létrehozásakor");
  return await valasz.json();
}

// Elérhetőség törlése
export async function elerhetosegTorlese(id) {
  const valasz = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!valasz.ok) throw new Error("Hiba az elérhetőség törlésekor");
}
