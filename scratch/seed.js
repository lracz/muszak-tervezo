const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const serviceAccount = require('../MuszakBeosztasAPI/firebase-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearCollection(collectionPath) {
    console.log(`Clearing ${collectionPath}...`);
    const ref = db.collection(collectionPath);
    const snapshot = await ref.get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
        // Keep the main HR admin if you want, but user said "let's wipe all and create"
        // If we wipe all, we need to recreate an Admin user.
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`${collectionPath} cleared.`);
}

async function seed() {
    try {
        await clearCollection('dolgozok');
        await clearCollection('muszakok');
        await clearCollection('elerhetoseg');
        await clearCollection('beosztasok');
        
        console.log("Seeding started...");
        
        const passwordHash = bcrypt.hashSync('Munka1234', 10);
        
        // 1. Create Users
        const dolgozok = [
            { Nev: 'Admin / HR', Email: 'admin@ceg.hu', Szerepkor: 'HR', Pozicio: 'Rendszergazda', MaxHetiOra: 40, JelszoHash: passwordHash, Telefonszam: '+36301234567' },
            { Nev: 'Kovács János', Email: 'kovacs.j@ceg.hu', Szerepkor: 'Dolgozo', Pozicio: 'Szakács', MaxHetiOra: 40, JelszoHash: passwordHash, Telefonszam: '+36201234567' },
            { Nev: 'Nagy Anna', Email: 'nagy.a@ceg.hu', Szerepkor: 'Dolgozo', Pozicio: 'Pultos', MaxHetiOra: 40, JelszoHash: passwordHash, Telefonszam: '+36701234567' },
            { Nev: 'Szabó Péter', Email: 'szabo.p@ceg.hu', Szerepkor: 'Dolgozo', Pozicio: 'Futár', MaxHetiOra: 30, JelszoHash: passwordHash, Telefonszam: '+36309876543' },
            { Nev: 'Varga Kata', Email: 'varga.k@ceg.hu', Szerepkor: 'Dolgozo', Pozicio: 'Pultos', MaxHetiOra: 40, JelszoHash: passwordHash, Telefonszam: '+36209876543' },
            { Nev: 'Tóth Balázs', Email: 'toth.b@ceg.hu', Szerepkor: 'Dolgozo', Pozicio: 'Szakács', MaxHetiOra: 40, JelszoHash: passwordHash, Telefonszam: '+36709876543' }
        ];
        
        const savedDolgozok = [];
        for (const d of dolgozok) {
            const ref = await db.collection('dolgozok').add(d);
            savedDolgozok.push({ ...d, Id: ref.id });
        }
        
        console.log("Users created.");
        
        // 2. Create Shifts (Muszakok) for a typical week
        const muszakok = [];
        const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
        
        for (const day of days) {
            // Reggeli
            muszakok.push({
                Megnevezes: 'Reggeli műszak (Szakács)',
                Nap: day,
                Kezdes: '06:00',
                Befejezes: '14:00',
                SzuksegesLetszam: 1,
                Pozicio: 'Szakács',
                Megjegyzes: ''
            });
            
            // Nappali Pultos
            muszakok.push({
                Megnevezes: 'Nappali műszak (Pultos)',
                Nap: day,
                Kezdes: '10:00',
                Befejezes: '18:00',
                SzuksegesLetszam: 2,
                Pozicio: 'Pultos',
                Megjegyzes: ''
            });
            
            // Délutáni
            muszakok.push({
                Megnevezes: 'Délutáni műszak',
                Nap: day,
                Kezdes: '14:00',
                Befejezes: '22:00',
                SzuksegesLetszam: 2,
                Pozicio: 'Vegyes',
                Megjegyzes: ''
            });
        }
        
        const savedMuszakok = [];
        for (const m of muszakok) {
            const ref = await db.collection('muszakok').add(m);
            savedMuszakok.push({ ...m, Id: ref.id });
        }
        console.log("Shifts created.");
        
        // 3. Create Availabilities (Elerhetoseg)
        for (const worker of savedDolgozok) {
            if (worker.Szerepkor === 'HR') continue; // Skip HR
            
            for (const day of days) {
                // Random availability or everyone is mostly available
                // Let's make Szabó Péter unavailable on weekends
                let isAvailable = true;
                if (worker.Nev === 'Szabó Péter' && (day === 'Szombat' || day === 'Vasárnap')) {
                    isAvailable = false;
                }
                
                await db.collection('elerhetoseg').add({
                    DolgozoId: worker.Id,
                    Nap: day,
                    Elerheto: isAvailable,
                    Megjegyzes: isAvailable ? '' : 'Hétvégi pihenő'
                });
            }
        }
        console.log("Availabilities created.");
        
        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch(err) {
        console.error("Error seeding:", err);
        process.exit(1);
    }
}

seed();
