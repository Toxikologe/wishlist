// 1. TRAGE HIER DEINE EIGENE STEAM-ID EIN
const STEAM_ID = '76561198133148029'; 

// Wir nutzen einen alternativen, oft schnelleren Proxy
const PROXY_URL = 'https://corsproxy.io/?';
const STEAM_WUNSCHLISTE_URL = encodeURIComponent(`https://store.steampowered.com/wishlist/profiles/${STEAM_ID}/wishlistdata/`);

async function ladeWunschliste() {
    const container = document.getElementById('spiele-container');
    container.innerHTML = '<p class="lade-text">Lade echte Daten von Steam...</p>';

    try {
        const response = await fetch(PROXY_URL + STEAM_WUNSCHLISTE_URL);
        
        if (!response.ok) {
            throw new Error(`Proxy-Fehler: Server antwortete mit Status ${response.status}`);
        }
        
        // corsproxy gibt uns die Daten direkt, wir müssen sie nicht extra entpacken
        const steamData = await response.json();

        // Check 1: Hat Steam einen Fehlercode gesendet? (Meistens wegen privatem Profil)
        if (steamData.success === 2) {
             container.innerHTML = `<p class="lade-text" style="color: #ff4a4a;">
                <b>Zugriff verweigert:</b> Dein Steam-Profil oder deine "Spieldetails" sind nicht auf Öffentlich gestellt.
             </p>`;
             return;
        }

        // Check 2: Ist die Wunschliste komplett leer?
        if (Array.isArray(steamData) && steamData.length === 0) {
            container.innerHTML = '<p class="lade-text">Deine Wunschliste ist leer.</p>';
            return;
        }

        // Daten umwandeln
        const spieleArray = Object.entries(steamData).map(([appId, daten]) => {
            return { id: appId, ...daten };
        });

        // Spiele anzeigen
        spieleAnzeigen(spieleArray);

    } catch (error) {
        // Jetzt zeigen wir den echten technischen Fehler auf der Seite an!
        console.error('Detaillierter Fehler:', error);
        container.innerHTML = `<div class="lade-text" style="color: #ff4a4a;">
            <p><b>Fehler beim Laden der Steam-Daten.</b></p>
            <p style="font-size: 0.8em; color: #8f98a0;">Technischer Grund: ${error.message}</p>
            <p style="font-size: 0.8em; color: #8f98a0;">Tipp: Drücke F12 und schaue in die "Console" für mehr Details.</p>
        </div>`;
    }
}

function spieleAnzeigen(spieleArray) {
    const container = document.getElementById('spiele-container');
    container.innerHTML = ''; 

    spieleArray.forEach(spiel => {
        const istRegistriert = localStorage.getItem(`playtest_${spiel.id}`) === 'true';

        let preisText = "Preis unbekannt";
        if (spiel.subs && spiel.subs.length > 0 && spiel.subs[0].price) {
            preisText = (spiel.subs[0].price / 100).toFixed(2) + " €";
        } else if (spiel.is_free_game) {
            preisText = "Kostenlos";
        }

        const karte = document.createElement('div');
        karte.className = 'spiel-karte';

        karte.innerHTML = `
            <img src="${spiel.capsule}" alt="${spiel.name}">
            <h3>${spiel.name}</h3>
            <p><strong>Release:</strong> ${spiel.release_string || 'Unbekannt'}</p>
            <p><strong>Preis:</strong> ${preisText}</p>
            
            <label class="playtest-label">
                <input type="checkbox" class="playtest-check" data-id="${spiel.id}" ${istRegistriert ? 'checked' : ''}>
                Für Playtest registriert
            </label>
        `;
        
        container.appendChild(karte);
    });

    document.querySelectorAll('.playtest-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const spielId = e.target.getAttribute('data-id');
            localStorage.setItem(`playtest_${spielId}`, e.target.checked);
        });
    });
}

ladeWunschliste();
