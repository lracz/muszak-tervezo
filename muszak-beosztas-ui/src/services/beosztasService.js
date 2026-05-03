// API szolgáltatás a beosztások kezelésére
const API_URL = `${import.meta.env.VITE_API_URL}/api/beosztas`;

// Beosztás generálása az adott hétre
export async function beosztasGeneralasa(het) {
  const valasz = await fetch(`${API_URL}/general/${het}`, {
    method: "POST",
  });
  if (!valasz.ok) throw new Error("Hiba a beosztás generálásakor");
  return await valasz.json();
}

// Heti beosztás lekérdezése
export async function hetiBeosztasLekerdezese(het) {
  const valasz = await fetch(`${API_URL}/${het}`);
  if (valasz.status === 404) return null;
  if (!valasz.ok) throw new Error("Hiba a beosztás lekérdezésekor");
  return await valasz.json();
}

// Beosztás véglegesítése
export async function beosztasVeglegesitese(id) {
  const valasz = await fetch(`${API_URL}/${id}/veglegesit`, {
    method: "PUT",
  });
  if (!valasz.ok) throw new Error("Hiba a beosztás véglegesítésekor");
  return await valasz.json();
}

// Manuálisan módosított beosztás mentése
export async function beosztasModositasa(id, ujReszletek) {
  const valasz = await fetch(`${API_URL}/${id}/modosit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(ujReszletek)
  });
  if (!valasz.ok) throw new Error("Hiba a beosztás módosításakor");
  return await valasz.json();
}
