// API szolgáltatás a műszakok kezelésére
const API_URL = "http://localhost:5148/api/muszak";

// Összes műszak lekérdezése
export async function muszakokLekerdezese() {
  const valasz = await fetch(API_URL);
  if (!valasz.ok) throw new Error("Hiba a műszakok lekérdezésekor");
  return await valasz.json();
}

// Új műszak létrehozása
export async function muszakLetrehozasa(muszak) {
  const valasz = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(muszak),
  });
  if (!valasz.ok) throw new Error("Hiba a műszak létrehozásakor");
  return await valasz.json();
}

// Műszak frissítése
export async function muszakFrissitese(id, muszak) {
  const valasz = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(muszak),
  });
  if (!valasz.ok) throw new Error("Hiba a műszak frissítésekor");
}

// Műszak törlése
export async function muszakTorlese(id) {
  const valasz = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!valasz.ok) throw new Error("Hiba a műszak törlésekor");
}
