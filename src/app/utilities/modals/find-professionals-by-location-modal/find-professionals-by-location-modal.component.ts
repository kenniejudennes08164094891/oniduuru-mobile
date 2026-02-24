import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { ViewAllTalentsPopupModalComponent } from '../view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import {EmmittersService} from "../../../services/emmitters.service";

declare var google: any;

// Define interfaces for Google Maps
interface OverlayViewMethods {
  onAdd: () => void;
  draw: () => void;
  onRemove: () => void;
  setMap: (map: any) => void;
  getPanes?: () => any;
  getProjection?: () => any;
}

type OverlayView = OverlayViewMethods & any;

// Pulse Overlay Class using Google Maps OverlayView - 2 RINGS, SMALLER SIZE
class PulseOverlay {
  private latLng: any;
  private map: any;
  private talent: any;
  private index: number;
  private isActive: boolean = false;
  private div: HTMLElement | null = null;
  private overlay: OverlayView;
  private animationFrame: number | null = null;

  constructor(latLng: any, map: any, talent: any, index: number) {
    this.latLng = latLng;
    this.map = map;
    this.talent = talent;
    this.index = index;

    // Create the OverlayView
    this.overlay = new google.maps.OverlayView();

    // Bind methods
    this.overlay.onAdd = this.onAdd.bind(this);
    this.overlay.draw = this.draw.bind(this);
    this.overlay.onRemove = this.onRemove.bind(this);
  }

  onAdd(): void {
    this.div = document.createElement('div');
    this.div.className = 'pulse-overlay';
    this.div.style.position = 'absolute';
    this.div.style.width = '50px'; // REDUCED from 70px to 50px
    this.div.style.height = '50px'; // REDUCED from 70px to 50px
    this.div.style.borderRadius = '50%';
    this.div.style.pointerEvents = 'none';
    this.div.style.zIndex = '999';
    this.div.style.display = 'none';
    this.div.style.willChange = 'transform, opacity';

    // NO CENTER DOT - REMOVED COMPLETELY

    // Create pulse ring elements - REDUCED to 2 rings
    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('div');
      ring.className = `pulse-ring pulse-ring-${i + 1}`;
      ring.style.position = 'absolute';
      ring.style.top = '0';
      ring.style.left = '0';
      ring.style.width = '100%';
      ring.style.height = '100%';
      ring.style.borderRadius = '50%';
      ring.style.border = '2px solid #FF3B3B'; // THINNER border
      ring.style.opacity = '0';
      ring.style.animation = `radarPulse 2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite`;
      ring.style.animationDelay = `${i * 0.6}s`; // Adjusted delay for 2 rings
      ring.style.willChange = 'transform, opacity';
      ring.style.boxShadow = '0 0 8px rgba(255, 59, 59, 0.3)'; // REDUCED shadow
      ring.style.transformOrigin = 'center';
      this.div.appendChild(ring);
    }

    // Add CSS animation to document head if not already present
    this.addAnimationStyles();

    const panes = (this.overlay as any).getPanes();
    if (panes) {
      panes.overlayMouseTarget.appendChild(this.div);
    }
  }

  private addAnimationStyles(): void {
    // Check if styles already added
    if (document.getElementById('pulse-overlay-styles')) return;

    const style = document.createElement('style');
    style.id = 'pulse-overlay-styles';
    style.textContent = `
      @keyframes radarPulse {
        0% {
          transform: scale(0.7);
          opacity: 0.8;
        }
        30% {
          opacity: 0.5;
        }
        70% {
          opacity: 0.2;
        }
        100% {
          transform: scale(1.6);
          opacity: 0;
        }
      }

      @keyframes activePulse {
        0% {
          transform: scale(0.8);
          opacity: 1;
        }
        40% {
          opacity: 0.6;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }

      .pulse-overlay {
        pointer-events: none;
        will-change: transform, opacity;
      }

      .pulse-overlay .pulse-ring {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 2px solid #FF3B3B;
        opacity: 0;
        animation: radarPulse 2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        will-change: transform, opacity;
        box-shadow: 0 0 8px rgba(255, 59, 59, 0.3);
        transform-origin: center;
      }

      .pulse-overlay.active .pulse-ring {
        border-color: #FF0000;
        border-width: 2.5px;
        animation: activePulse 1.2s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        box-shadow: 0 0 12px rgba(255, 0, 0, 0.5);
      }
    `;
    document.head.appendChild(style);
  }

  draw(): void {
    const projection = (this.overlay as any).getProjection();
    if (!projection || !this.div) return;

    const point = projection.fromLatLngToDivPixel(this.latLng);
    if (point) {
      // Center the overlay on the marker - ADJUSTED for 50px size
      this.div.style.left = point.x - 25 + 'px';
      this.div.style.top = point.y - 25 + 'px';
      this.div.style.display = 'block';
    }
  }

  onRemove(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.div) {
      if (this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
      this.div = null;
    }
  }

  setMap(map: any): void {
    (this.overlay as any).setMap(map);
  }

  activate(): void {
    if (this.div) {
      this.div.classList.add('active');
      this.isActive = true;
    }
  }

  deactivate(): void {
    if (this.div) {
      this.div.classList.remove('active');
      this.isActive = false;
    }
  }

  enhancePulsing(intensity: number = 1.2): void {
    if (!this.div) return;

    const rings = this.div.querySelectorAll('.pulse-ring');
    rings.forEach((ring) => {
      (ring as HTMLElement).style.animationDuration = `${2 / intensity}s`;
      (ring as HTMLElement).style.borderColor =
        intensity > 1.5 ? '#FF0000' : '#FF3B3B';
      (ring as HTMLElement).style.boxShadow =
        `0 0 ${8 * intensity}px rgba(255, ${intensity > 1.5 ? '0' : '59'}, ${intensity > 1.5 ? '0' : '59'}, 0.4)`;
    });
  }
}

// TalentMarker Interface
interface TalentMarker {
  marker: any;
  location: { lat: number; lng: number };
  talent: any;
  index: number;
  pulseOverlay?: PulseOverlay;
  avatarIcon?: any;
  hoverIcon?: any;
  clickIcon?: any;
}

@Component({
  selector: 'app-find-professionals-by-location-modal',
  templateUrl: './find-professionals-by-location-modal.component.html',
  styleUrls: ['./find-professionals-by-location-modal.component.scss'],
  standalone: false,
})
export class FindProfessionalsByLocationModalComponent
  extends BaseModal
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() hires: any[] = [];
  @Input() location: string = '';
  @Input() allSkills: string[] = [];

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  images = imageIcons;
  loading: boolean = true;
  error: string | null = null;
  private markers: TalentMarker[] = [];

  // Filter properties
  selectedSkill: string = '';
  currentLocation = '';
  filteredHires: any[] = [];
  selectedTalent: any = null;

  // Map properties
  private map: any = null;
  private geocoder: any = null;
  private infoWindow: any = null;
  private mapInitialized = false;

  // Nigerian states with their major cities and LGAs
  private readonly NIGERIAN_LOCATIONS: {
    [key: string]: {
      coordinates: { lat: number; lng: number };
      cities: string[];
      lgAs: string[];
      areaNames: string[];
      aliases: string[];
    };
  } = {
    lagos: {
      coordinates: { lat: 6.5244, lng: 3.3792 },
      cities: [
        'lekki',
        'ikoyi',
        'victoria island',
        'vi',
        'ikeja',
        'maryland',
        'surulere',
        'yaba',
        'ajah',
      ],
      lgAs: [
        'agege',
        'alimosho',
        'amuwo-odofin',
        'apapa',
        'badagry',
        'epe',
        'eti-osa',
      ],
      areaNames: [
        'adeniji',
        'adeola',
        'aguda',
        'ajah',
        'ajegunle',
        'akoka',
        'alausa',
      ],
      aliases: ['lag', 'lasgidi', 'eko'],
    },
    abuja: {
      coordinates: { lat: 9.0765, lng: 7.3986 },
      cities: [
        'garki',
        'wuse',
        'maitama',
        'asokoro',
        'gwarimpa',
        'jabi',
        'kubwa',
      ],
      lgAs: ['abuja municipal', 'bwari', 'gwagwalada', 'kuje', 'kwali'],
      areaNames: [
        'apex',
        'asokoro',
        'central',
        'dutse',
        'garki',
        'gudu',
        'gwarimpa',
      ],
      aliases: ['fct', 'capital'],
    },
    'port harcourt': {
      coordinates: { lat: 4.8156, lng: 7.0498 },
      cities: ['ph', 'port', 'rivers'],
      lgAs: [
        'port harcourt',
        'obio-akpor',
        'eleme',
        'etche',
        'ikwerre',
        'oyigbo',
      ],
      areaNames: ['aba road', 'agip', 'airport', 'alakahia', 'alu', 'amadi'],
      aliases: ['phcity', 'rivers state'],
    },
    kano: {
      coordinates: { lat: 12.0022, lng: 8.592 },
      cities: ['kano'],
      lgAs: [
        'kano municipal',
        'nasarawa',
        'fagge',
        'dala',
        'gwale',
        'kumbotso',
      ],
      areaNames: ['bompai', 'gyadi', 'hotoro', 'jakara', 'kabuga', 'kofar'],
      aliases: ['kano city'],
    },
    ibadan: {
      coordinates: { lat: 7.3775, lng: 3.947 },
      cities: ['ibadan', 'oyo'],
      lgAs: [
        'ibadan north',
        'ibadan north-east',
        'ibadan north-west',
        'ibadan south-east',
      ],
      areaNames: ['agodi', 'bodija', 'challenge', 'dugbe', 'gate', 'jericho'],
      aliases: ['ib city'],
    },
    benin: {
      coordinates: { lat: 6.3176, lng: 5.6145 },
      cities: ['benin', 'edo'],
      lgAs: ['benin city', 'ekpoma', 'auchi', 'irrua', 'ugbowo'],
      areaNames: ['akpakpava', 'etete', 'g.r.a', 'ikpoba', 'new', 'ogba'],
      aliases: ['edo state'],
    },
  };

  private navSub?: Subscription;
  private currentCardElement: HTMLElement | null = null;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private emmitters: EmmittersService
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.currentLocation = this.location || 'Professionals Location';
    this.filteredHires = this.filterByLocation(this.hires, this.location);

    if (this.allSkills && this.allSkills.length > 0) {
      this.selectedSkill = '';
    }

    console.log('🌍 Map modal initialized:', {
      location: this.currentLocation,
      totalTalents: this.hires?.length,
      filteredTalents: this.filteredHires.length,
    });

    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  private preloadProfileImages(talents: any[]): void {
    talents.forEach((talent) => {
      const profilePicUrl =
        talent.profilePic || 'assets/images/default-avatar.png';
      if (profilePicUrl !== 'assets/images/default-avatar.png') {
        const img = new Image();
        img.src = profilePicUrl;
        img.onload = () =>
          console.log(`✅ Preloaded profile image: ${talent.name}`);
        img.onerror = () =>
          console.warn(`⚠️ Failed to load profile image: ${talent.name}`);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
      if (this.filteredHires.length > 0) {
        this.preloadProfileImages(this.filteredHires);
      }
    }, 100);
  }

  private filterByLocation(talents: any[], location: string): any[] {
    if (!talents || talents.length === 0) {
      console.log('📍 No talents to filter');
      return [];
    }
    return [...talents];
  }

  private getStateFromLocation(location: string): string | null {
    const normalizedLocation = location.toLowerCase();
    for (const state in this.NIGERIAN_LOCATIONS) {
      if (normalizedLocation.includes(state.toLowerCase())) {
        return state;
      }
      if (
        this.NIGERIAN_LOCATIONS[state].aliases?.some((alias) =>
          normalizedLocation.includes(alias.toLowerCase()),
        )
      ) {
        return state;
      }
    }
    return null;
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]',
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', reject);
        return;
      }

      const apiKey = environment.googleMapsApiKey;
      if (!apiKey) {
        reject(new Error('Google Maps API key missing'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async getDefaultMapCenter(): Promise<{ lat: number; lng: number }> {
    const state = this.getStateFromLocation(this.location.toLowerCase());
    if (state && this.NIGERIAN_LOCATIONS[state]) {
      return this.NIGERIAN_LOCATIONS[state].coordinates;
    }

    if (this.filteredHires && this.filteredHires.length > 0) {
      for (let i = 0; i < this.filteredHires.length; i++) {
        const talent = this.filteredHires[i];
        const location = await this.getTalentCoordinates(talent, i);
        if (location) {
          return location;
        }
      }
    }

    return { lat: 9.082, lng: 8.6753 };
  }

  private async initializeMap(): Promise<void> {
    try {
      await this.loadGoogleMapsScript();

      const defaultCenter = await this.getDefaultMapCenter();

      // DARK THEME for Google Maps
      const darkTheme = [
        { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        {
          featureType: 'administrative',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#2b2b2b' }],
        },
        {
          featureType: 'road',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#3c3c3c' }],
        },
        {
          featureType: 'road.local',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }],
        },
      ];

      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: defaultCenter,
        zoom: 12,
        styles: darkTheme,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        backgroundColor: '#000000',
      });

      this.geocoder = new google.maps.Geocoder();
      this.infoWindow = new google.maps.InfoWindow();

      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(defaultCenter);
        this.mapInitialized = true;
        this.addTalentMarkers();
      }, 50);

      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }, 800);
    } catch (error) {
      console.error('Error initializing map:', error);
      this.error = 'Failed to load map. Please check your internet connection.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async getTalentCoordinates(
    talent: any,
    index: number,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const addressFormats = [
        talent.address,
        talent.proximity,
        talent.location,
        `${talent.address}, ${this.location}`,
        this.location,
      ];

      for (const address of addressFormats) {
        if (address && typeof address === 'string') {
          const location = await this.geocodeAddress(address, index);
          if (location) {
            const existingCoords = this.markers
              .map((m) => m.location)
              .filter(Boolean);
            const isDuplicate = existingCoords.some(
              (coord) =>
                Math.abs(coord.lat - location.lat) < 0.0001 &&
                Math.abs(coord.lng - location.lng) < 0.0001,
            );

            if (isDuplicate) {
              const offset = 0.0001;
              return {
                lat: location.lat + index * offset * 0.7,
                lng: location.lng + index * offset * 1.3,
              };
            }
            return location;
          }
        }
      }

      const state = this.getStateFromLocation(this.location.toLowerCase());
      let baseCoords = { lat: 6.5244, lng: 3.3792 };

      if (state && this.NIGERIAN_LOCATIONS[state]) {
        baseCoords = this.NIGERIAN_LOCATIONS[state].coordinates;
      }

      const angle = index * 137.5 * (Math.PI / 180);
      const radius = 0.003 * (index + 1);

      return {
        lat: baseCoords.lat + Math.cos(angle) * radius,
        lng: baseCoords.lng + Math.sin(angle) * radius,
      };
    } catch (error) {
      console.warn(`Could not get coordinates for talent ${index}:`, error);
      return {
        lat: 6.5244 + (Math.random() * 0.02 - 0.01) + index * 0.001,
        lng: 3.3792 + (Math.random() * 0.02 - 0.01) + index * 0.001,
      };
    }
  }

  private async geocodeAddress(
    address: string,
    index: number,
  ): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!this.geocoder) {
        resolve(null);
        return;
      }

      const cleanAddress = address
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,$/, '')
        .replace(/Lagos Nigeria, Nigeria/, 'Lagos, Nigeria');

      this.geocoder.geocode(
        { address: cleanAddress },
        (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
            });
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  private async addTalentMarkers(): Promise<void> {
    if (!this.map || !this.mapInitialized) return;

    this.clearMarkers();

    if (this.filteredHires.length === 0) {
      console.log('📍 Modal: No talents to display');
      return;
    }

    console.log(
      '📍 Modal: Adding markers for talents:',
      this.filteredHires.length,
    );

    for (let i = 0; i < this.filteredHires.length; i++) {
      const talent = this.filteredHires[i];
      try {
        const location = await this.getTalentCoordinates(talent, i);
        if (location) {
          await this.createTalentMarker(talent, location, i);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error creating marker for talent ${i}:`, error);
      }
    }

    setTimeout(() => {
      this.fitMapBounds();
    }, 500);
  }

  private createRoundedImageIcon(
    imageUrl: string,
    size: number = 36, // REDUCED from 44 to 36
    borderColor: string = '#FF3B3B',
    borderWidth: number = 2, // THINNER border
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const canvasSize = size + borderWidth * 2;

          canvas.width = canvasSize;
          canvas.height = canvasSize;

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw border
          ctx.beginPath();
          ctx.arc(
            canvasSize / 2,
            canvasSize / 2,
            canvasSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = borderColor;
          ctx.fill();

          // Draw white background
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Clip and draw image
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();

          const imageSize = size;
          const imageX = borderWidth;
          const imageY = borderWidth;
          ctx.drawImage(img, imageX, imageY, imageSize, imageSize);

          ctx.restore();

          const dataUrl = canvas.toDataURL('image/png');

          const icon = {
            url: dataUrl,
            scaledSize: new google.maps.Size(canvasSize, canvasSize),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(canvasSize / 2, canvasSize / 2),
          };

          resolve(icon);
        } catch (error) {
          console.error('Error creating rounded image:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        this.createDefaultRoundedIcon(size, borderColor, borderWidth)
          .then(resolve)
          .catch(reject);
      };
    });
  }

  private createDefaultRoundedIcon(
    size: number = 36, // REDUCED from 44 to 36
    borderColor: string = '#FF3B3B',
    borderWidth: number = 2, // THINNER border
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const canvasSize = size + borderWidth * 2;

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw border
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();

        // Draw white background
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Draw default avatar icon (silhouette) - SCALED for smaller size
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2 - 3, size / 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
          canvasSize / 2,
          canvasSize / 2 + 6,
          size / 4.5,
          size / 6.5,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        const dataUrl = canvas.toDataURL('image/png');

        const icon = {
          url: dataUrl,
          scaledSize: new google.maps.Size(canvasSize, canvasSize),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(canvasSize / 2, canvasSize / 2),
        };

        resolve(icon);
      } catch (error) {
        console.error('Error creating default icon:', error);
        reject(error);
      }
    });
  }

  private async createTalentMarker(
    talent: any,
    location: any,
    index: number,
  ): Promise<void> {
    if (!this.map || !google.maps) {
      console.error('❌ Map or Google Maps not available');
      return;
    }

    console.log(`📍 Creating marker for ${talent.name} at:`, location);

    try {
      const profilePicUrl =
        talent.profilePic || 'assets/images/default-avatar.png';

      // Create icons for different states - SMALLER size (36px)
      const baseIcon = await this.createRoundedImageIcon(
        profilePicUrl,
        36, // REDUCED from 44 to 36
        '#FF3B3B',
        2, // REDUCED from 2.5 to 2
      );
      const hoverIcon = await this.createRoundedImageIcon(
        profilePicUrl,
        36, // REDUCED from 44 to 36
        '#FF3B3B',
        3, // REDUCED from 3.5 to 3
      );
      const clickIcon = await this.createRoundedImageIcon(
        profilePicUrl,
        36, // REDUCED from 44 to 36
        '#FF0000',
        3.5, // REDUCED from 4 to 3.5
      );

      // Create the marker with DROP animation
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lng),
        map: this.map,
        title: talent.name,
        icon: baseIcon,
        zIndex: 1000 + index,
        optimized: false,
        animation: google.maps.Animation.DROP,
      });

      // Create pulse overlay - 2 RINGS, SMALLER SIZE
      const pulseOverlay = new PulseOverlay(
        new google.maps.LatLng(location.lat, location.lng),
        this.map,
        talent,
        index,
      );
      pulseOverlay.setMap(this.map);

      // Hover effects
      marker.addListener('mouseover', async () => {
        marker.setIcon(hoverIcon);
        marker.setZIndex(2000 + index);
        pulseOverlay.enhancePulsing(1.3);
      });

      marker.addListener('mouseout', async () => {
        marker.setIcon(baseIcon);
        marker.setZIndex(1000 + index);
        pulseOverlay.deactivate();
      });

      // Click listener
      marker.addListener('click', async () => {
        // Close any existing info window and card
        if (this.infoWindow) {
          this.infoWindow.close();
        }
        if (this.currentCardElement) {
          this.closeProfileCardElement(this.currentCardElement);
        }

        // Show profile card
        this.showProfileCard(talent, marker, index);

        // Center map on marker with smooth pan
        this.map.panTo(new google.maps.LatLng(location.lat, location.lng));

        // Enhance marker and pulse
        marker.setIcon(clickIcon);
        pulseOverlay.activate();

        // Reset after 1 second
        setTimeout(async () => {
          marker.setIcon(baseIcon);
          pulseOverlay.deactivate();
        }, 1000);
      });

      // Store marker data
      this.markers.push({
        marker,
        location,
        talent,
        index,
        pulseOverlay,
        avatarIcon: baseIcon,
        hoverIcon,
        clickIcon,
      });

      console.log(`📍 Modal Marker ${index} created at:`, {
        lat: location.lat,
        lng: location.lng,
        name: talent.name,
      });
    } catch (error) {
      console.error('Error creating talent marker:', error);
      this.createSimpleMarker(talent, location, index);
    }
  }

  // Helper method to find marker DOM element
  private findMarkerElement(marker: any): HTMLElement | null {
    try {
      // Try to find marker element in Google Maps container
      const mapContainer = this.mapContainer?.nativeElement;
      if (!mapContainer) return null;

      // This is an approximation - Google Maps doesn't expose marker elements directly
      const allImages = mapContainer.querySelectorAll('img[src*="data:image"]');
      for (let img of allImages) {
        const parent = img.parentElement;
        if (parent && parent.style.position === 'absolute') {
          return parent as HTMLElement;
        }
      }
    } catch (e) {
      console.debug('Could not find marker element');
    }
    return null;
  }

  private createSimpleMarker(talent: any, location: any, index: number): void {
    try {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lng),
        map: this.map,
        title: talent.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          strokeColor: '#FF2D2D',
          strokeWeight: 3,
        },
        animation: google.maps.Animation.DROP,
        zIndex: 1000 + index,
      });

      marker.addListener('click', () => {
        this.showTalentInfo(talent, marker, index);
        this.map.panTo(new google.maps.LatLng(location.lat, location.lng));
      });

      this.markers.push({
        marker,
        location,
        talent,
        index,
      });
    } catch (error) {
      console.error('Error creating simple marker:', error);
    }
  }

  private showProfileCard(talent: any, marker: any, index: number): void {
    this.selectedTalent = talent;
    this.emmitters.setTalentIdForHire(talent?.talentId);
    this.cdr.detectChanges();
    // Create the profile card element
    const div = document.createElement('div');
    div.className = 'profile-card-overlay';
    div.style.position = 'fixed';
    div.style.width = '320px';
    div.style.minHeight = '220px';
    div.style.zIndex = '10000';
    div.style.pointerEvents = 'auto';
    div.style.opacity = '0';
    div.style.transition =
      'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -45%) scale(0.95)';
    div.style.backgroundColor = 'transparent';

    // Get skills as skill tags
    const skillTags =
      talent.skillSet
        ?.slice(0, 3)
        .map((s: any) => s.jobTitle)
        .filter(Boolean) || [];

    // Create card HTML - REMOVED any extra red dots
    div.innerHTML = `
    <div class="profile-card" style="position: relative; padding: 24px; height: 100%; background: white; border-radius: 20px; box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3); border: 2px solid #FF3B3B; overflow: hidden;">
      <button class="close-card-btn"
              aria-label="Close profile card"
              style="position: absolute; top: 12px; right: 12px; background: #f5f5f5; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M13 1L1 13M1 1L13 13" stroke="#666666" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="card-header" style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; margin-top: 8px;">
        <div class="avatar-container" style="width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 3px solid #FF3B3B; box-shadow: 0 4px 12px rgba(255, 59, 59, 0.3); transition: all 0.2s ease;">
          <img src="${talent.profilePic || 'assets/images/default-avatar.png'}"
               class="profile-avatar"
               alt="${talent.name}"
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.src='assets/images/default-avatar.png'">
        </div>
        <div class="profile-info" style="flex: 1; min-width: 0;">
          <h3 class="profile-name" style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${talent.name}
          </h3>
          <div class="skill-tags" style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${skillTags
              .map(
                (skill: any) => `
              <span class="skill-tag" style="background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 16px; font-size: 11px; font-weight: 500; white-space: nowrap;">
                ${skill}
              </span>
            `,
              )
              .join('')}
            ${talent.skillSet?.length > 3 ? `<span class="more-skills" style="color: #FF3B3B; font-size: 11px; font-weight: bold; margin-left: 4px;">+${talent.skillSet.length - 3}</span>` : ''}
          </div>
        </div>
      </div>

      <button class="view-profile-btn"
              data-talent-id="${talent.id || index}"
              style="width: 100%; background: linear-gradient(135deg, #FF3B3B, #FF6B6B); color: white; border: none; border-radius: 12px; padding: 14px; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); margin-top: auto; box-shadow: 0 4px 12px rgba(255, 59, 59, 0.3);">
        View Full Profile
      </button>
    </div>
  `;

    // Add to body
    document.body.appendChild(div);
    this.currentCardElement = div;

    // Animate in with spring effect
    requestAnimationFrame(() => {
      div.style.opacity = '1';
      div.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    // Add event listeners
    setTimeout(() => {
      const viewProfileBtn = div.querySelector('.view-profile-btn');
      const closeBtn = div.querySelector('.close-card-btn');

      if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openTalentModal(talent);
          this.closeProfileCardElement(div);
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeProfileCardElement(div);
        });
      }

      // Close card when clicking outside
      const closeOnOutsideClick = (e: MouseEvent) => {
        if (div && !div.contains(e.target as Node)) {
          this.closeProfileCardElement(div);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', closeOnOutsideClick);
      }, 0);

      (div as any).outsideClickListener = closeOnOutsideClick;
    }, 50);
  }

  private closeProfileCardElement(cardElement: HTMLElement): void {
    if (cardElement) {
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'translate(-50%, -45%) scale(0.95)';

      if ((cardElement as any).outsideClickListener) {
        document.removeEventListener(
          'click',
          (cardElement as any).outsideClickListener,
        );
      }

      setTimeout(() => {
        if (cardElement.parentNode) {
          cardElement.parentNode.removeChild(cardElement);
        }
        this.currentCardElement = null;
      }, 250);
    }
  }
  private showTalentInfo(talent: any, marker: any, index: number): void {
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    this.selectedTalent = talent;
    this.cdr.detectChanges();

    try {
      const skillsText =
        talent.skillSet
          ?.slice(0, 2)
          .map((s: any) => s.jobTitle)
          .join(', ') || 'No skills listed';

      const hasMoreSkills = talent.skillSet?.length > 2;

      const content = `
        <div class="bg-gray-900 text-white rounded-xl border-2 border-red-500 shadow-2xl overflow-hidden max-w-xs">
          <div class="relative bg-gradient-to-r from-red-900/20 to-transparent p-3">
            <div class="flex items-center gap-3">
              <div class="relative">
                <img src="${talent.profilePic || 'assets/images/default-avatar.png'}"
                     class="w-12 h-12 rounded-full border-3 border-red-500 object-cover shadow-lg"
                     alt="${talent.name}"
                     onerror="this.src='assets/images/default-avatar.png'">
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-base text-white truncate">${talent.name}</h3>
                <div class="flex items-center gap-1 mt-1">
                  <ion-icon name="briefcase-outline" class="text-red-400 text-xs"></ion-icon>
                  <span class="text-xs text-gray-300 truncate">${skillsText}</span>
                  ${hasMoreSkills ? '<span class="text-xs text-red-400 ml-1">+ more</span>' : ''}
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-gray-800/50">
            <button id="view-profile-${talent.id || index}"
                    class="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2 px-3 rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2">
              <ion-icon name="person-circle-outline" class="text-base"></ion-icon>
              View Full Profile
            </button>
          </div>
        </div>
      `;

      this.infoWindow.setContent(content);

      const markerPosition = marker.getPosition();
      const pixelOffset = new google.maps.Size(0, -50);

      this.infoWindow.setOptions({
        position: markerPosition,
        pixelOffset: pixelOffset,
      });

      this.infoWindow.open(this.map);

      // Center the map on the marker
      this.map.panTo(markerPosition);

      // Add button click listener
      setTimeout(() => {
        const button = document.getElementById(
          `view-profile-${talent.id || index}`,
        );
        if (button) {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openTalentModal(talent);
            this.infoWindow.close();
          });
        }
      }, 50);
    } catch (error) {
      console.error('Error showing talent info:', error);
    }
  }

  getMapHeight(): number {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 600;
  }

  async openTalentModal(talent: any): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: { hire: talent },
      cssClass: 'all-talents-fullscreen-modal',
    });

    await modal.present();
  }

  private fitMapBounds(): void {
    if (this.markers.length === 0 || !this.map || !google.maps) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      let validMarkers = 0;

      this.markers.forEach((markerInfo) => {
        if (markerInfo.location && markerInfo.marker) {
          bounds.extend(markerInfo.marker.getPosition());
          validMarkers++;
        }
      });

      if (validMarkers > 0) {
        this.map.fitBounds(bounds, {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        });

        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
          if (validMarkers === 1 && this.map.getZoom() > 16) {
            this.map.setZoom(16);
          } else if (validMarkers < 5 && this.map.getZoom() > 14) {
            this.map.setZoom(14);
          } else if (validMarkers > 20 && this.map.getZoom() < 12) {
            this.map.setZoom(12);
          }
        });
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  }

  private clearMarkers(): void {
    this.markers.forEach((markerInfo: TalentMarker) => {
      try {
        // Clear marker
        if (markerInfo.marker && markerInfo.marker.setMap) {
          markerInfo.marker.setMap(null);
        }

        // Clear pulse overlay
        if (markerInfo.pulseOverlay) {
          markerInfo.pulseOverlay.setMap(null);
        }
      } catch (error) {
        console.error('Error clearing marker:', error);
      }
    });
    this.markers = [];
  }

  filterTalents(): void {
    if (!this.hires || this.hires.length === 0) {
      this.filteredHires = [];
      return;
    }

    let filtered = this.filterByLocation(this.hires, this.location);

    if (this.selectedSkill) {
      filtered = filtered.filter((hire: any) => {
        return hire.skillSet?.some((s: any) =>
          s.jobTitle?.toLowerCase().includes(this.selectedSkill.toLowerCase()),
        );
      });
    }

    this.filteredHires = filtered;

    if (this.selectedSkill) {
      this.currentLocation = `${this.location} - ${this.selectedSkill}`;
    } else {
      this.currentLocation = this.location;
    }

    if (this.mapInitialized) {
      this.addTalentMarkers();
    }

    if (this.selectedTalent) {
      const isStillInList = this.filteredHires.some(
        (hire) =>
          hire.id === this.selectedTalent.id ||
          hire.name === this.selectedTalent.name,
      );
      if (!isStillInList) {
        this.selectedTalent = null;
        if (this.infoWindow) {
          this.infoWindow.close();
        }
      }
    }

    this.cdr.detectChanges();
  }

  closeModal() {
    this.dismiss();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    if (this.map) {
      this.initializeMap();
    } else {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  override ngOnDestroy(): void {
    if (this.map) {
      this.clearMarkers();
      google.maps.event.clearInstanceListeners(this.map);
    }

    if (this.infoWindow) {
      this.infoWindow.close();
    }

    if (this.currentCardElement) {
      this.closeProfileCardElement(this.currentCardElement);
    }

    this.navSub?.unsubscribe();
    this.mapInitialized = false;
  }
}
