import { initializeGeoGirafeCustomStyles, SplashScreen } from '@geogirafe/lib-geoportal/tools';
import { GeoGirafeAppMobile } from '@geogirafe/lib-geoportal/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSONFormat from 'ol/format/GeoJSON';
import { Style, Icon } from 'ol/style';
import type { FeatureLike } from 'ol/Feature';

const splash = new SplashScreen();
splash.begin();
initializeGeoGirafeCustomStyles();

const girafeApp = new GeoGirafeAppMobile();

const SPORT_ICONS: Record<number, string> = {
  1: 'assets/foot-s.png',
  2: 'assets/tennis-s.png',
  3: 'assets/basket-s.png',
  4: 'assets/golf-s.png',
  5: 'assets/volley-s.png',
  6: 'assets/multisport-s.png',
};

const styleCache: Record<string, Style> = {};

function sportStyle(feature: FeatureLike): Style {
  const sportId = feature.get('sport') as number;
  const iconSrc = SPORT_ICONS[sportId] ?? 'assets/multisport-s.png';
  if (!styleCache[iconSrc]) {
    styleCache[iconSrc] = new Style({
      image: new Icon({ src: iconSrc, scale: 1.2 }),
    });
  }
  return styleCache[iconSrc];
}

girafeApp.isReady().then(() => {
  splash.end();

  const map = girafeApp.context.mapManager.getMap();

  const sportsSource = new VectorSource({
    url: 'data/sports.geojson',
    format: new GeoJSONFormat({
      dataProjection: 'EPSG:2056',
      featureProjection: 'EPSG:2056',
    }),
  });

  const sportsLayer = new VectorLayer({
    source: sportsSource,
    style: sportStyle,
    zIndex: 100,
  });

  map.addLayer(sportsLayer);

  // Popup au tap (position: fixed, adapté mobile)
  const popupEl = document.getElementById('w2p-popup') as HTMLElement | null;
  const popupContent = document.getElementById('w2p-popup-content') as HTMLElement | null;
  const popupClose = document.getElementById('w2p-popup-close') as HTMLElement | null;

  if (popupEl && popupContent) {
    const hidePopup = () => { popupEl.style.display = 'none'; };

    popupClose?.addEventListener('click', hidePopup);

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

        const mapEl = map.getTargetElement() as HTMLElement;
        const rect = mapEl.getBoundingClientRect();
        popupEl.style.left = `${rect.left + evt.pixel[0]}px`;
        popupEl.style.top = `${rect.top + evt.pixel[1]}px`;
        popupEl.style.display = 'block';
      } else {
        hidePopup();
      }
    });
  }
});
