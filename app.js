// 1. TRAGE HIER DEINE EIGENE STEAM-ID EIN (die lange 64-Bit Nummer)
const STEAM_ID = '76561198133148029'; 

// Wir nutzen einen Proxy, um die Sicherheitsblockade (CORS) des Browsers zu umgehen
const PROXY_URL = 'https://api.allorigins.win/get?url=';
const STEAM_WUNSCHLISTE_URL = encodeURIComponent(`https://store.steampowered.com/wishlist/profiles/${STEAM_ID}/wishlistdata/`);

// Hauptfunktion zum Laden der Daten
async function ladeWunschliste() {
    const container = document.getElementById('spiele-container');
    container.innerHTML = '<p class="lade-text">Lade echte Daten von Steam...</p>';

    try {
        // Anfrage an Steam (über den Proxy) senden
        const response = await fetch(PROXY_URL + STEAM_WUNSCHLISTE_URL);
        
        if (!response.ok) throw new Error('Netzwerkfehler');
        
        const proxyData = await response.json();
        const steamData = JSON.parse(proxyData.contents); // Der Proxy packt die Steam-Daten in "contents"

        // Wenn Steam einen Fehler zurückgibt (z.B. Profil ist privat)
        if (steamData.success === 2) {
             container.innerHTML = '<p class="lade-text" style="color: #ff4a4a;">Fehler: Dein Steam-Profil ist privat oder die Steam-ID ist falsch.</p>';
             return;
        }

        // Steam liefert uns ein seltsames Objekt. Wir wandeln es in ein sauberes Array um, damit wir besser damit arbeiten können.
        const spieleArray = Object.entries(steamData).map(([appId, daten]) => {
            return {
                id: appId,
                ...daten
            };
        });

        // Spiele anzeigen
        spieleAnzeigen(spieleArray);

    } catch (error) {
        console.error('Fehler beim Laden:', error);
        container.innerHTML = '<p class="lade-text" style="color: #ff4a4a;">Fehler beim Laden der Steam-Daten.</p>';
    }
}

// Funktion um die Spiele ins HTML zu zeichnen
function spieleAnzeigen(spieleArray) {
    const container = document.getElementById('spiele-container');
    container.innerHTML = ''; // Lade-Text entfernen

    spieleArray.forEach(spiel => {
        // Prüfen, ob Playtest lokal abgehakt ist
        const istRegistriert = localStorage.getItem(`playtest_${spiel.id}`) === 'true';

        // Preis sicher auslesen (Steam liefert den manchmal in Cent, manchmal gar nicht)
        let preisText = "Preis unbekannt";
        if (spiel.subs && spiel.subs.length > 0 && spiel.subs[0].price) {
            preisText = (spiel.subs[0].price / 100).toFixed(2) + " €";
        } else if (spiel.is_free_game) {
            preisText = "Kostenlos";
        }

        // Karte erstellen
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

    // Event-Listener für die Checkboxen (Speichern im Browser)
    document.querySelectorAll('.playtest-check').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const spielId = e.target.getAttribute('data-id');
            localStorage.setItem(`playtest_${spielId}`, e.target.checked);
        });
    });
}

// Skript starten, sobald die Datei geladen ist
ladeWunschliste();
