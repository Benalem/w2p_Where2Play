import { initializeGeoGirafeCustomStyles, redirectTo, SplashScreen } from '@geogirafe/lib-geoportal/tools';
import { GeoGirafeApp } from '@geogirafe/lib-geoportal/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { Style, Icon } from 'ol/style';
import Overlay from 'ol/Overlay';
import type { FeatureLike } from 'ol/Feature';

import MyFirstComponent from './components/my-first-component/component';
import MyExtendedComponent from './components/my-extended-component/component';

if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('Android')) {
  const redirectUrl = document.querySelector('meta[name=redirect-url]')?.getAttribute('content');
  if (redirectUrl) redirectTo(redirectUrl);
}

const splash = new SplashScreen();
splash.begin();
initializeGeoGirafeCustomStyles();

const girafeApp = new GeoGirafeApp();

// Icône par type de sport (correspond aux fichiers assets/*-s.png)
const SPORT_ICONS: Record<number, string> = {
  1: 'assets/foot-s.png',
  2: 'assets/tennis-s.png',
  3: 'assets/basket-s.png',
  4: 'assets/golf-s.png',
  5: 'assets/volley-s.png',
  6: 'assets/multisport-s.png',
};

// Cache des styles pour ne pas recréer un objet Style à chaque rendu
const styleCache: Record<string, Style> = {};

function sportStyle(feature: FeatureLike): Style {
  const sportId = feature.get('sport') as number;
  const iconSrc = SPORT_ICONS[sportId] ?? 'assets/multisport-s.png';
  if (!styleCache[iconSrc]) {
    styleCache[iconSrc] = new Style({
      image: new Icon({ src: iconSrc, scale: 1 }),
    });
  }
  return styleCache[iconSrc];
}

girafeApp.isReady().then(() => {
  customElements.define('my-first-component', MyFirstComponent);
  customElements.define('my-extended-component', MyExtendedComponent);

  splash.end();
  girafeApp.context.onBoardingManager.start();

  // --- Couche sports GeoJSON ---
  const map = girafeApp.context.mapManager.getMap();

  const sportsSource = new VectorSource({
    url: 'data/sports.geojson',
    format: new GeoJSONFormat(),
  });

  const sportsLayer = new VectorLayer({
    source: sportsSource,
    style: sportStyle,
    zIndex: 100,
  });

  map.addLayer(sportsLayer);

  // --- Popup au clic ---
  const popupEl = document.getElementById('w2p-popup') as HTMLElement | null;
  const popupContent = document.getElementById('w2p-popup-content') as HTMLElement | null;
  const popupClose = document.getElementById('w2p-popup-close') as HTMLElement | null;

  if (popupEl && popupContent) {
    const overlay = new Overlay({ element: popupEl, autoPan: { animation: { duration: 200 } } });
    map.addOverlay(overlay);

    popupClose?.addEventListener('click', () => {
      overlay.setPosition(undefined);
      popupEl.classList.remove('visible');
    });

    map.on('singleclick', (evt) => {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (f) => f,
        { layerFilter: (l) => l === sportsLayer }
      );

      if (feature) {
        const p = feature.getProperties() as Record<string, string | number>;
        const icon = SPORT_ICONS[p['sport'] as number] ?? 'assets/multisport-s.png';
        popupContent.innerHTML = `
          <div class="w2p-sport-badge">
            <img src="${icon}" alt="${p['sport_txt']}" width="24" height="24" />
            <span>${p['sport_txt'] ?? 'Terrain'}</span>
          </div>
          <table class="w2p-table">
            <tr><th>Revêtement</th><td>${p['revetement_txt'] || '—'}</td></tr>
            <tr><th>État</th><td>${p['etat_txt'] || '—'}</td></tr>
            <tr><th>Accès</th><td>${p['est_publique_txt'] || '—'}</td></tr>
            ${p['remarque'] ? `<tr><th>Remarque</th><td>${p['remarque']}</td></tr>` : ''}
            ${p['date_modification'] ? `<tr><th>Mis à jour</th><td>${p['date_modification']}</td></tr>` : ''}
          </table>
          ${p['g_url'] ? `<a class="w2p-gmaps" href="${p['g_url']}" target="_blank" rel="noopener">📍 Google Maps</a>` : ''}
        `;
        overlay.setPosition(evt.coordinate);
        popupEl.classList.add('visible');
      } else {
        overlay.setPosition(undefined);
        popupEl.classList.remove('visible');
      }
    });

    // Curseur pointer sur les features sport
    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel, { layerFilter: (l) => l === sportsLayer });
      (map.getTargetElement() as HTMLElement).style.cursor = hit ? 'pointer' : '';
    });
  }
});
