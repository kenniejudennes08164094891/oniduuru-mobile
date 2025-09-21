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
import { ModalController } from '@ionic/angular';
import { FindProfessionalsByLocationModalComponent } from 'src/app/utilities/modals/find-professionals-by-location-modal/find-professionals-by-location-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-talents-location-page',
  templateUrl: './view-talents-location-page.component.html',
  styleUrls: ['./view-talents-location-page.component.scss'],
})
export class ViewTalentsLocationPageComponent implements OnInit, AfterViewInit {
  map!: Map;
  overlay!: Overlay;
  popupContent!: HTMLElement; // <-- add this
  hires = MockRecentHires;

  talents: MockPayment[] = MockRecentHires;

  searchQuery = '';

  headerHidden = false;
  images = imageIcons;

  currentLocation: string = '';

  setCurrentLocation(location: string) {
    this.currentLocation = location;
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  ngOnInit(): void {
    // For now hardcode; later you can pull from geolocation
    this.currentLocation = 'Lagos';
  }

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
          source: new OSM({
            attributions: [], // 👈 removes OpenStreetMap watermark
          }),
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

  async performSearch() {
    const query = this.searchQuery.toLowerCase().trim();

    const filtered = this.talents.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(query);
      const skillMatch = t.skillSet?.some(
        (s) =>
          s.jobTitle.toLowerCase().includes(query) ||
          s.skillLevel.toLowerCase().includes(query)
      );
      const locationMatch = t.location.city?.toLowerCase().includes(query);
      return nameMatch || skillMatch || locationMatch;
    });

    this.loadMarkers(filtered);

    // 👇 always open the modal
    const modal = await this.modalCtrl.create({
      component: FindProfessionalsByLocationModalComponent,
      componentProps: {
        hires: filtered, // could be [] if no result
        location: query || 'Unknown',
      },
      cssClass: 'all-talents-fullscreen-modal',
    });
    await modal.present();
  }

  get currentLocationHires() {
    return this.hires.filter(
      (h) =>
        h.location.city.toLowerCase() === this.currentLocation.toLowerCase()
    );
  }

  async openFindProfessionalsByLocationModal(hires: any[], location: string) {
    console.log('Opening modal with hires:', hires, 'and location:', location);

    const modal = await this.modalCtrl.create({
      component: FindProfessionalsByLocationModalComponent,
      componentProps: {
        hires,
        location: location || 'Unknown', // fallback to avoid blank header
      },
      cssClass: 'all-talents-fullscreen-modal',
      initialBreakpoint: 1,
      backdropDismiss: true,
    });
    await modal.present();
  }
}
