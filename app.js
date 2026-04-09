// 1. TRAGE HIER DEINE 17-STELLIGE STEAM-ID EIN
const STEAM_ID = '76561198133148029'; 

const PROXY_URL = 'https://corsproxy.io/?';
// ACHTUNG: Das "/wishlistdata/" am Ende ist jetzt weg! Wir rufen die ECHTE Webseite auf.
const STEAM_WUNSCHLISTE_URL = encodeURIComponent(`https://store.steampowered.com/wishlist/profiles/${STEAM_ID}/`);

async function ladeWunschliste() {
    const container = document.getElementById('spiele-container');
    container.innerHTML = '<p class="lade-text">Lese Wunschliste aus dem Quellcode (Neues Verfahren)...</p>';

    try {
        const response = await fetch(PROXY_URL + STEAM_WUNSCHLISTE_URL);
        
        if (!response.ok) {
            throw new Error(`Proxy-Fehler: Status ${response.status}`);
        }
        
        // Wir holen den gesamten HTML-Text der Steam-Seite
        const html = await response.text();

        // 🕵️‍♂️ Regex-Suche: Wir zerschneiden den HTML-Code und suchen exakt das versteckte Datenpaket
        const match = html.match(/var g_rgAppInfo = (\{.*?\});\s*var/s);
        
        if (!match || match.length < 2) {
             container.innerHTML = `<p class="lade-text" style="color: #ff4a4a;">
                <b>Fehler:</b> Konnte die Spieldaten im Quellcode nicht finden. Entweder ist die Wunschliste komplett leer, oder das Profil wird noch blockiert.
             </p>`;
             return;
        }

        // Wir verwandeln den herausgeschnittenen Text in ein sauberes JavaScript-Objekt
        const steamData = JSON.parse(match[1]);

        if (Object.keys(steamData).length === 0) {
            container.innerHTML = '<p class="lade-text">Deine Wunschliste ist leer.</p>';
            return;
        }

        // Daten umwandeln
        const spieleArray = Object.entries(steamData).map(([appId, daten]) => {
            return { id: appId, ...daten };
        });

        // Spiele endlich anzeigen!
        spieleAnzeigen(spieleArray);

    } catch (error) {
        console.error('Detaillierter Fehler:', error);
        container.innerHTML = `<div class="lade-text" style="color: #ff4a4a;">
            <p><b>Fehler beim Laden.</b></p>
            <p style="font-size: 0.8em; color: #8f98a0;">Technischer Grund: ${error.message}</p>
        </div>`;
    }
}

function spieleAnzeigen(spieleArray) {
    const container = document.getElementById('spiele-container');
    container.innerHTML = ''; 

    spieleArray.forEach(spiel => {
        const istRegistriert = localStorage.getItem(`playtest_${spiel.id}`) === 'true';

        // Preis sicher auslesen
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
