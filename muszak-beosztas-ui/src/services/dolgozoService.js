// API szolgáltatás a dolgozók kezelésére
const API_URL = "http://localhost:5148/api/dolgozo";

// Összes dolgozó lekérdezése
export async function dolgozokLekerdezese() {
  try {
    const valasz = await fetch(API_URL);
    if (!valasz.ok) {
      throw new Error("Hiba a dolgozók lekérdezésekor");
    }
    return await valasz.json();
  } catch (hiba) {
    console.error("Hiba:", hiba);
    throw hiba;
  }
}

// Új dolgozó létrehozása
export async function dolgozoLetrehozasa(dolgozo) {
  try {
    const valasz = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dolgozo),
    });
    if (!valasz.ok) {
      throw new Error("Hiba a dolgozó létrehozásakor");
    }
    return await valasz.json();
  } catch (hiba) {
    console.error("Hiba:", hiba);
    throw hiba;
  }
}

// Dolgozó frissítése
export async function dolgozoFrissitese(id, dolgozo) {
  try {
    const valasz = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dolgozo),
    });
    if (!valasz.ok) {
      throw new Error("Hiba a dolgozó frissítésekor");
    }
  } catch (hiba) {
    console.error("Hiba:", hiba);
    throw hiba;
  }
}

// Dolgozó törlése
export async function dolgozoTorlese(id) {
  try {
    const valasz = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!valasz.ok) {
      throw new Error("Hiba a dolgozó törlésekor");
    }
  } catch (hiba) {
    console.error("Hiba:", hiba);
    throw hiba;
  }
}
