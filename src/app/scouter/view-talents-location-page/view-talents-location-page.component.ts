import { Component, OnInit, AfterViewInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';
import Overlay from 'ol/Overlay';
import { imageIcons } from 'src/app/models/stores';
import { MockRecentHires, MockPayment } from 'src/app/models/mocks'; // update path

interface Talent {
  name: string;
  location: { lat: number; lng: number };
  skillSet: string[];
}

@Component({
  selector: 'app-view-talents-location-page',
  templateUrl: './view-talents-location-page.component.html',
  styleUrls: ['./view-talents-location-page.component.scss'],
})
export class ViewTalentsLocationPageComponent implements OnInit, AfterViewInit {
  map!: Map;
  overlay!: Overlay;
  popupContent!: HTMLElement; // <-- add this

  talents: MockPayment[] = MockRecentHires;

  searchQuery = '';

  headerHidden = false;
  images = imageIcons;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadMarkers();
  }

  initMap() {
    // 1️⃣ Create the map
    this.map = new Map({
      target: 'talentsMap', // ID of your div
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([3.3792, 6.5244]), // Lagos coordinates
        zoom: 13,
      }),
    });

    // 2️⃣ Setup popup overlay
    const container = document.getElementById('popup')!;
    this.popupContent = document.getElementById('popup-content')!;
    const closer = document.getElementById('popup-closer')!;

    this.overlay = new Overlay({
      element: container,
      autoPan: { animation: { duration: 250 } },
    });
    this.map.addOverlay(this.overlay);

    closer.onclick = () => {
      this.overlay.setPosition(undefined);
      closer.blur();
      return false;
    };
  }

  loadMarkers(filteredTalents: MockPayment[] = this.talents) {
    const features = filteredTalents.map((t) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([t.location.lng, t.location.lat])),
        name: t.name,
        skills: t.skillSet.map((s) => s.jobTitle).join(', '), // convert to string
        location: t.location,
      });

      feature.setStyle(
        new Style({
          image: new Icon({
            color: '#007bff',
            crossOrigin: 'anonymous',
            src: 'https://openlayers.org/en/latest/examples/data/dot.png',
          }),
        })
      );

      return feature;
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource({ features }),
    });

    // Remove old marker layers (keep OSM base at index 0)
    const layers = this.map.getLayers().getArray();
    if (layers.length > 1) layers.splice(1);
    this.map.addLayer(vectorLayer);

    // Popup click
    this.map.on('singleclick', (evt) => {
      const feature = this.map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        const coordinate = evt.coordinate;
        const name = feature.get('name');
        const skills = feature.get('skills');
        const location = feature.get('location'); // { lat, lng, city? }

        // Format location nicely
        let locationText = '';
        if (location.city) {
          locationText = location.city;
        } else {
          locationText = `Lat: ${location.lat}, Lng: ${location.lng}`;
        }

        this.popupContent.innerHTML = `<b>${name}</b><br>Skills: ${skills}<br>Location: ${locationText}`;
        this.overlay.setPosition(coordinate);
      } else {
        this.overlay.setPosition(undefined);
      }
    });
  }

  performSearch() {
    const query = this.searchQuery.toLowerCase().trim();

    const filtered = this.talents.filter((t) => {
      // match name
      const nameMatch = t.name.toLowerCase().includes(query);

      // match skills
      const skillMatch = t.skillSet?.some(
        (s) =>
          s.jobTitle.toLowerCase().includes(query) ||
          s.skillLevel.toLowerCase().includes(query)
      );

      // match location city
      const locationMatch = t.location.city?.toLowerCase().includes(query);

      return nameMatch || skillMatch || locationMatch;
    });

    // Reload markers with filtered talents
    this.loadMarkers(filtered);

    // 👇 If at least one match, zoom to the first talent’s location
    if (filtered.length > 0) {
      const first = filtered[0];
      this.map.getView().animate({
        center: fromLonLat([first.location.lng, first.location.lat]),
        zoom: 14,
        duration: 1000,
      });
    }
  }
}
