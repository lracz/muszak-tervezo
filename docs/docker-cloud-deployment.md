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

## 4. Zero-Trust Networking (Cloudflare Tunnel)

Ha nem szeretnél külső felhőszolgáltatókra (Google, Vercel) támaszkodni, hanem a **saját otthoni szervereden (vagy Raspberry Pi-don)** futtatnád a projektet, és szeretnéd biztonságosan, publikusan elérhetővé tenni a weben, a **Cloudflare Tunnel (cloudflared)** a legprofibb megoldás (Sprint 10).

**Miért kiváló választás?**
- **Nincs Port Forwarding:** Nem kell beállítani a routeredet, és működik szigorú hálózatokon (pl. egyetemi kollégium, CGNAT) is.
- **Zero-Trust Biztonság:** Senki nem látja az otthoni szervered igazi IP címét. A forgalom a Cloudflare szerverein folyik keresztül, így azonnali DDoS védelmet kapsz.
- **Ingyenes SSL/TLS:** A Cloudflare automatikusan biztosít neked HTTPS tanúsítványt a saját domainedhez (pl. `muszak.sajatneved.hu`).

**Beállítás lépései (Docker-Compose sidecar):**
1. Regisztrálj a Cloudflare Zero Trust dashboardon, és hozz létre egy új Tunnel-t.
2. A Dashboard adni fog egy titkos tokent (pl. `eyJh...`).
3. Add hozzá a `cloudflared` szolgáltatást a `docker-compose.yml` fájlod végéhez:
```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=IDE_MASOLD_BE_A_TITKOS_TOKENEDET
    restart: unless-stopped
```
4. A Cloudflare Dashboardon állítsd be a **Public Hostname** fülön, hogy a domained mutasson a Docker konténer belső hálózatára (pl. `http://frontend:80` vagy ahol a React fut).
5. Indítsd el a konténereket a `docker-compose up -d` paranccsal, és a rendszered biztonságosan kikerül a világhálóra!
