# Dockerizáció és Cloud Deployment Útmutató

A Műszak Tervező szoftvert a 7. Sprint keretében felkészítettük a mikroszolgáltatás-alapú konténerizált futtatásra és a felhőbe (Cloud) történő telepítésre.

## 1. Lokális Futtatás Docker-el

A rendszer lokális teszteléséhez a Docker Compose a legegyszerűbb módszer. Ehhez a számítógépen telepítve kell lennie a Docker Desktopnak.

**Lépések:**
1. Győződj meg róla, hogy a `firebase-config.json` fájl ott van a projekt gyökerében (a Git ignored).
2. Nyiss egy terminált a projekt gyökerében.
3. Futtasd a build és start parancsot:
```bash
docker-compose up --build
```
A konténerek elindulnak:
- A React Frontend az `http://localhost:5173` porton (Nginx szolgálja ki).
- A .NET Backend az `http://localhost:8080` porton várja az API kéréseket.

## 2. CI/CD Terv (GitHub Actions)

A projekt automatikus tesztelésére és közzétételére GitHub Actions workflow-t használhatunk. Egy `.github/workflows/main.yml` fájllal a következő folyamatot automatizálhatjuk minden `git push` esetén a `main` branchre:

1. Kód letöltése.
2. `dotnet test` futtatása a `.Tests` mappán (Megakadályozza a törött kód publikálását).
3. Docker image-ek buildelése a frontendhez és backendhez.
4. Image-ek feltöltése egy Container Registry-be (pl. GitHub GHCR, Docker Hub vagy Google Artifact Registry).

## 3. Cloud Deployment (Google Cloud Run / Vercel)

A legköltséghatékonyabb Serverless felhő architektúra a következő:

### Frontend (Vercel)
A React frontendet érdemesebb közvetlenül Vercelre vagy Netlify-ra deploy-olni a Docker helyett, mivel ezek automatikus CDN elosztást és SSL tanúsítványt biztosítanak.
- Csatlakoztasd a GitHub repót Vercelhez.
- Állítsd be a Root Directory-t `muszak-beosztas-ui`-ra.
- Adatvédelmi szempontból a `VITE_API_URL` környezeti változóban kell megadni a publikált backend címét.

### Backend (Google Cloud Run)
Mivel az adatbázis (Firestore) a Google felhőjében fut, logikus a backendet a **Google Cloud Run**-ban futtatni (alacsony késleltetés, skálázhatóság, 0-ra skálázódás forgalom hiányában).
1. Telepítsd a `gcloud CLI`-t.
2. Készíts buildet: `gcloud builds submit --tag gcr.io/[PROJEKT_ID]/muszak-backend`
3. Deploy: `gcloud run deploy --image gcr.io/[PROJEKT_ID]/muszak-backend --platform managed`
4. **Fontos:** A Google Cloud Run környezetben a szolgáltató automatikusan integrálja a Firestore hitelesítést (Service Account), ha ugyanazon a GCP projekten futnak, így még `firebase-config.json` fájlt sem kell bajlódva beinjektálni a konténerbe!

*(Alternatíva: Azure App Service Container futtatás, ahol a Registryből húzzuk be az image-t.)*
