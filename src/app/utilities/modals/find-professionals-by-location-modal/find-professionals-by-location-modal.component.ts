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

// Import environment
import { environment } from 'src/environments/environment';

declare var google: any;

interface TalentMarker {
  marker: any;
  location: { lat: number; lng: number };
  talent: any;
  index: number;
  pulseRing1?: any;
  pulseRing2?: any;
  pulseCircle?: any;
  startPulsing?: () => void;
  stopPulsing?: () => void;
  pulseAnimation1?: number | null;
  pulseAnimation2?: number | null;
  pulseAnimation?: number | null;
}

// Then update your markers declaration:

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

  // Nigerian states with their major cities and LGAs (all in lowercase for case-insensitive matching)
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
        'ikota',
        'ogba',
        'agege',
        'alimosho',
        'amuwo-odofin',
        'apapa',
        'badagry',
        'epe',
        'eti-osa',
        'ibeju-lekki',
        'ifako-ijaiye',
        'ikeja',
        'ikorodu',
        'kosofe',
        'lago mainland',
        'mushin',
        'ojo',
        'oshodi-isolo',
        'shomolu',
        'somolu',
      ],
      lgAs: [
        'agege',
        'ajoakuta',
        'alimosho',
        'amuwo-odofin',
        'apapa',
        'badagry',
        'epe',
        'eti-osa',
        'ibeju-lekki',
        'ifako-ijaiye',
        'ikeja',
        'ikorodu',
        'kosofe',
        'lagos island',
        'lagos mainland',
        'mushin',
        'ojo',
        'oshodi-isolo',
        'shomolu',
        'surulere',
      ],
      areaNames: [
        'adeniji',
        'adeola',
        'adeyemo',
        'agidingbi',
        'aguda',
        'ajah',
        'ajegunle',
        'akerele',
        'akoka',
        'alagomeji',
        'alausa',
        'alimosho',
        'amowo odofin',
        'anthony',
        'apapa',
        'ayobo',
        'bariga',
        'cms',
        'dolphin',
        'ebute',
        'egbeda',
        'ejigbo',
        'fadeyi',
        'festac',
        'gbagada',
        'idimu',
        'idi-oro',
        'idiroko',
        'igando',
        'iganmu',
        'igbo',
        'ijaiye',
        'ijaye',
        'ijegun',
        'ijora',
        'ikeja',
        'ikorodu',
        'ikota',
        'ilasa',
        'ile-epo',
        'ile-zik',
        'ilogbo',
        'ilupeju',
        'ipaja',
        'isolo',
        'itire',
        'jibowu',
        'julius',
        'ketu',
        'lawanson',
        'lekki',
        'magodo',
        'marina',
        'maryland',
        'maza-maza',
        'mende',
        'mile 2',
        'mushin',
        'ogba',
        'ogudu',
        'ojo',
        'oke-afa',
        'oke-ira',
        'okerube',
        'okota',
        'olo',
        'olorunsogo',
        'omole',
        'onike',
        'onipanu',
        'orile',
        'oshodi',
        'ota',
        'oworo',
        'oyingbo',
        'palm',
        'palmgrove',
        'sabo',
        'shitta',
        'shomolu',
        'sura',
        'surulere',
        'tejuosho',
        'toll',
        'trade',
        'victoria',
        'yaba',
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
        'lugbe',
        'nyanya',
        'karu',
        'jikwoyi',
        'kuje',
        'bwari',
        'gwagwalada',
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
        'jabi',
        'jahi',
        'kado',
        'katampe',
        'kaura',
        'kubwa',
        'lifecamp',
        'lokogoma',
        'lugbe',
        'maitama',
        'mpape',
        'nyanya',
        'piwoyi',
        'utako',
        'wuse',
        'wuse 2',
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
        'okrika',
        'akah',
        'andoni',
        'asari-toru',
        'bonny',
        'degema',
        'emohua',
        'gokana',
        'khana',
        'ogba-egbema-ndoni',
        'ogu-bolo',
        'opobo-nkoro',
        'tai',
      ],
      areaNames: [
        'aba road',
        'agip',
        'airport',
        'alakahia',
        'alu',
        'amadi',
        'borokiri',
        'choba',
        'diobu',
        'd-line',
        'elekahia',
        'elelenwo',
        'g.r.a',
        'garrison',
        'igwuruta',
        'ikoku',
        'iko',
        'ikwerre',
        'isiokpo',
        'mgbuoba',
        'military',
        'new',
        'old',
        'omu',
        'omuoko',
        'oyigbo',
        'ph',
        'railway',
        'refinery',
        'rumuibekwe',
        'rumukalagbor',
        'rumuodara',
        'rumuokoro',
        'rumuola',
        'rumuosi',
        'rumurolu',
        'trans',
        'woji',
      ],
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
        'tarauni',
        'ungogo',
        'kumbotso',
        'minjibir',
        'gezawa',
        'gabaski',
        'bunkure',
        'kibiya',
        'rimin',
        'gado',
        'tofa',
        'dawakin',
        'kudu',
        'wudil',
        'gwarzo',
        'karaye',
        'rogo',
        'kabo',
        'bebeji',
        'tsanyawa',
        'shanono',
        'bagwai',
        'gaya',
        'ajingi',
        'albasu',
        'waran',
        'makoda',
        'kunchi',
        'bichi',
      ],
      areaNames: [
        'bompai',
        'gyadi',
        'hotoro',
        'jakara',
        'kabuga',
        'kofar',
        'mata',
        'nasarawa',
        'sabon',
        'sharada',
        'tarauni',
        'wudil',
      ],
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
        'ibadan south-west',
        'akinyele',
        'egbeda',
        'ido',
        'lagelu',
        'oluyole',
        'ona-ara',
        'ogbomoso north',
        'ogbomoso south',
        'ori',
        'orelope',
        'saki east',
        'saki west',
        'atiba',
        'atisbo',
        'iwajowa',
        'kajola',
        'oyo east',
        'oyo west',
        'olang',
        'ogooluwa',
        'surulere',
        'seyi',
      ],
      areaNames: [
        'agodi',
        'bodija',
        'challenge',
        'dugbe',
        'gate',
        'jericho',
        'mokola',
        'ojoo',
        'sango',
        'ui',
        'university',
        'wole',
        'yemetu',
      ],
      aliases: ['ib city'],
    },
    benin: {
      coordinates: { lat: 6.3176, lng: 5.6145 },
      cities: ['benin', 'edo'],
      lgAs: [
        'benin city',
        'ekpoma',
        'ekpoma',
        'auchi',
        'irrua',
        'ugbowo',
        'uwelu',
        'sapele road',
        'airport road',
        'g.r.a',
        'ogba',
        'ikpoba',
        'okha',
        'ogene',
        'ovia',
        'ovia',
        'ovia',
        'ovia',
      ],
      areaNames: [
        'akpakpava',
        'etete',
        'g.r.a',
        'ikpoba',
        'new',
        'ogba',
        'ogene',
        'okha',
        'sapele',
        'third',
        'ugbowo',
        'uwelu',
      ],
      aliases: ['edo state'],
    },
  };

  private navSub?: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.currentLocation = this.location || 'Professionals Location';

    // Initialize filtered hires
    this.filteredHires = this.filterByLocation(this.hires, this.location);

    // Set default skill if available
    if (this.allSkills && this.allSkills.length > 0) {
      this.selectedSkill = '';
    }

    console.log('🌍 Map modal initialized:', {
      location: this.currentLocation,
      originalLocation: this.location,
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

      // Skip if it's the default avatar
      if (profilePicUrl !== 'assets/images/default-avatar.png') {
        const img = new Image();
        img.src = profilePicUrl;

        img.onload = () => {
          console.log(`✅ Preloaded profile image: ${talent.name}`);
        };

        img.onerror = () => {
          console.warn(`⚠️ Failed to load profile image: ${talent.name}`);
        };
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();

      // Preload profile images for better performance
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

    console.log(
      `📍 Modal: Received ${talents.length} talents for location "${location}"`,
    );

    // Show ALL talents passed from parent component
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
    // Get center based on location parameter (case-insensitive)
    const state = this.getStateFromLocation(this.location.toLowerCase());

    if (state && this.NIGERIAN_LOCATIONS[state]) {
      return this.NIGERIAN_LOCATIONS[state].coordinates;
    }

    // Try to get location from the first talent with valid coordinates
    if (this.filteredHires && this.filteredHires.length > 0) {
      for (let i = 0; i < this.filteredHires.length; i++) {
        const talent = this.filteredHires[i];
        const location = await this.getTalentCoordinates(talent, i);
        if (location) {
          return location;
        }
      }
    }

    // Fallback to Nigeria center
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

      // Set map to fill modal
      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(defaultCenter);
        this.mapInitialized = true;

        // Add talent markers
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
      // Try multiple address formats
      const addressFormats = [
        talent.address,
        talent.proximity,
        talent.location,
        `${talent.address}, ${this.location}`,
        this.location,
      ];

      for (const address of addressFormats) {
        if (address && typeof address === 'string') {
          console.log(`🌍 [${index}] Attempting to geocode: "${address}"`);
          const location = await this.geocodeAddress(address, index);
          if (location) {
            console.log(`✅ [${index}] Geocoded successfully:`, location);

            // Check for duplicate coordinates
            const existingCoords = this.markers
              .map((m) => m.location)
              .filter(Boolean);

            const isDuplicate = existingCoords.some(
              (coord) =>
                Math.abs(coord.lat - location.lat) < 0.0001 &&
                Math.abs(coord.lng - location.lng) < 0.0001,
            );

            if (isDuplicate) {
              console.log(`⚠️ [${index}] Duplicate coordinates, adjusting...`);
              // Add unique offset
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

      // If geocoding fails, use systematic offsets
      const state = this.getStateFromLocation(this.location.toLowerCase());
      let baseCoords = { lat: 6.5244, lng: 3.3792 }; // Default Lagos

      if (state && this.NIGERIAN_LOCATIONS[state]) {
        baseCoords = this.NIGERIAN_LOCATIONS[state].coordinates;
      }

      // Golden angle spiral for even distribution
      const angle = index * 137.5 * (Math.PI / 180);
      const radius = 0.003 * (index + 1);

      return {
        lat: baseCoords.lat + Math.cos(angle) * radius,
        lng: baseCoords.lng + Math.sin(angle) * radius,
      };
    } catch (error) {
      console.warn(`Could not get coordinates for talent ${index}:`, error);

      // Last resort random location with offset
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

      console.log(`🌍 Modal [${index}] Geocoding: "${cleanAddress}"`);

      this.geocoder.geocode(
        { address: cleanAddress },
        (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            console.log(`✅ Modal [${index}] Geocoded:`, {
              lat: location.lat(),
              lng: location.lng(),
            });
            resolve({
              lat: location.lat(),
              lng: location.lng(),
            });
          } else {
            console.log(`⚠️ Modal [${index}] Geocoding failed: ${status}`);
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

    // Process sequentially to ensure proper indexing
    for (let i = 0; i < this.filteredHires.length; i++) {
      const talent = this.filteredHires[i];

      try {
        // Get talent location with index for systematic offsets
        const location = await this.getTalentCoordinates(talent, i);

        if (location) {
          await this.createTalentMarker(talent, location, i);
        }

        // Small delay between markers for better visualization
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error creating marker for talent ${i}:`, error);
      }
    }

    // Fit bounds after all markers are added
    setTimeout(() => {
      console.log('📍 Modal: All markers added, fitting bounds...');
      this.fitMapBounds();

      // Debug marker count
      console.log('📍 Modal: Total markers created:', this.markers.length);
      console.log('📍 Modal: Expected markers:', this.filteredHires.length);

      // Log marker positions
      this.markers.forEach((markerInfo, index) => {
        console.log(`📍 Modal Marker ${index}:`, {
          name: markerInfo.talent?.name,
          lat: markerInfo.location?.lat,
          lng: markerInfo.location?.lng,
        });
      });
    }, 500);
  }

  // ====== REMOVE -=======
  private debugMarkerCreation() {
    console.log('🔍 MODAL MARKER DEBUG:');
    console.log('Total talents:', this.filteredHires.length);
    console.log('Total markers:', this.markers.length);

    this.markers.forEach((markerInfo, index) => {
      const marker = markerInfo.marker;
      if (marker) {
        console.log(`Modal Marker ${index} (${markerInfo.talent?.name}):`, {
          exists: !!marker,
          isOnMap: marker.getMap() === this.map,
          position: marker.getPosition()
            ? {
                lat: marker.getPosition().lat(),
                lng: marker.getPosition().lng(),
              }
            : 'No position',
          location: markerInfo.location,
          visible: marker.getVisible(),
        });
      }
    });
  }

  // Add this method to your component
  private createRoundedImageIcon(
    imageUrl: string,
    size: number = 50,
    borderColor: string = '#FF0000',
    borderWidth: number = 3,
  ): Promise<google.maps.Icon> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const canvasSize = size + borderWidth * 2;

          canvas.width = canvasSize;
          canvas.height = canvasSize;

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Draw red border circle
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

          // Draw white inner circle (background for transparency)
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Clip to circle for the image
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();

          // Draw the profile image
          const imageSize = size;
          const imageX = borderWidth;
          const imageY = borderWidth;
          ctx.drawImage(img, imageX, imageY, imageSize, imageSize);

          ctx.restore();

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png');

          // Create Google Maps icon
          const icon: google.maps.Icon = {
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
        // Fallback to default avatar
        console.warn('Failed to load profile image, using default');
        this.createDefaultRoundedIcon(size, borderColor, borderWidth)
          .then(resolve)
          .catch(reject);
      };
    });
  }

  private createDefaultRoundedIcon(
    size: number = 50,
    borderColor: string = '#FF0000',
    borderWidth: number = 3,
  ): Promise<google.maps.Icon> {
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

        // Draw red border circle
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();

        // Draw white inner circle
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Draw default avatar icon (person silhouette)
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, size / 3, 0, Math.PI * 2);
        ctx.fill();

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');

        const icon: google.maps.Icon = {
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
    if (!this.map || !google.maps) return;

    try {
      // Use profile picture URL or default avatar
      const profilePicUrl =
        talent.profilePic || 'assets/images/default-avatar.png';

      // Create rounded avatar icon (44px with 3px red border)
      const baseIcon = await this.createRoundedImageIcon(
        profilePicUrl,
        44, // Avatar size
        '#FF2D2D', // Red border color
        3, // Border width
      );

      // Create the primary marker with the avatar
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lng),
        map: this.map,
        title: talent.name,
        icon: baseIcon,
        zIndex: 1000 + index,
        optimized: false,
        animation: google.maps.Animation.DROP,
      });

      // Create two concentric pulse rings (radar effect)
      const pulseRing1 = new google.maps.Circle({
        strokeColor: 'rgba(255, 45, 45, 0.6)', // #FF2D2D with opacity
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: 'transparent',
        map: this.map,
        center: new google.maps.LatLng(location.lat, location.lng),
        radius: 45, // Start radius in meters
        visible: true,
      });

      const pulseRing2 = new google.maps.Circle({
        strokeColor: 'rgba(255, 45, 45, 0.4)', // Slightly more transparent
        strokeOpacity: 0.4,
        strokeWeight: 1.5,
        fillColor: 'transparent',
        map: this.map,
        center: new google.maps.LatLng(location.lat, location.lng),
        radius: 45,
        visible: true,
      });

      // Animation properties
      let isAnimating = true;
      let pulseAnimation1: number | null = null;
      let pulseAnimation2: number | null = null;

      // Create radar pulse animation
      const startPulsing = (): void => {
        if (!isAnimating) return;

        // First pulse ring animation
        pulseAnimation1 = setInterval(() => {
          const currentRadius = pulseRing1.getRadius();
          if (currentRadius >= 110) {
            // End radius
            pulseRing1.setRadius(45); // Reset to start
            pulseRing1.setOptions({ strokeOpacity: 0.6 });
          } else {
            const progress = (currentRadius - 45) / (110 - 45);
            const opacity = 0.6 * (1 - progress); // Fade out as it expands
            pulseRing1.setRadius(currentRadius + 0.8); // Expansion speed
            pulseRing1.setOptions({ strokeOpacity: opacity });
          }
        }, 16) as unknown as number; // ~60fps

        // Second pulse ring animation (offset by 300ms)
        setTimeout(() => {
          pulseAnimation2 = setInterval(() => {
            const currentRadius = pulseRing2.getRadius();
            if (currentRadius >= 110) {
              // End radius
              pulseRing2.setRadius(45); // Reset to start
              pulseRing2.setOptions({ strokeOpacity: 0.4 });
            } else {
              const progress = (currentRadius - 45) / (110 - 45);
              const opacity = 0.4 * (1 - progress); // Fade out as it expands
              pulseRing2.setRadius(currentRadius + 0.8); // Expansion speed
              pulseRing2.setOptions({ strokeOpacity: opacity });
            }
          }, 16) as unknown as number;
        }, 300);
      };

      const stopPulsing = (): void => {
        isAnimating = false;
        if (pulseAnimation1 !== null) {
          clearInterval(pulseAnimation1);
          pulseAnimation1 = null;
        }
        if (pulseAnimation2 !== null) {
          clearInterval(pulseAnimation2);
          pulseAnimation2 = null;
        }
        pulseRing1.setRadius(45);
        pulseRing2.setRadius(45);
      };

      const enhancePulsing = (): void => {
        // Temporarily enhance the pulse effect
        stopPulsing();

        // Create enhanced pulse
        pulseRing1.setOptions({
          strokeColor: 'rgba(255, 45, 45, 0.8)',
          strokeWeight: 3,
          strokeOpacity: 0.8,
        });

        pulseRing2.setOptions({
          strokeColor: 'rgba(255, 45, 45, 0.6)',
          strokeWeight: 2.5,
          strokeOpacity: 0.6,
        });

        // Restart normal pulsing after delay
        setTimeout(() => {
          pulseRing1.setOptions({
            strokeColor: 'rgba(255, 45, 45, 0.6)',
            strokeWeight: 2,
            strokeOpacity: 0.6,
          });

          pulseRing2.setOptions({
            strokeColor: 'rgba(255, 45, 45, 0.4)',
            strokeWeight: 1.5,
            strokeOpacity: 0.4,
          });

          isAnimating = true;
          startPulsing();
        }, 500);
      };

      // Start pulsing by default
      startPulsing();

      // Hover effect - enhance avatar border
      marker.addListener('mouseover', async () => {
        // Create avatar with thicker border on hover
        const hoverIcon = await this.createRoundedImageIcon(
          profilePicUrl,
          44,
          '#FF2D2D',
          5, // Thicker border on hover
        );
        marker.setIcon(hoverIcon);
        marker.setZIndex(2000 + index); // Boost z-index
        enhancePulsing();
      });

      marker.addListener('mouseout', async () => {
        // Reset to normal avatar
        marker.setIcon(baseIcon);
        marker.setZIndex(1000 + index);
      });

      // Click listener
      marker.addListener('click', async () => {
        // Show custom profile card instead of default info window
        this.showProfileCard(talent, marker, index);

        // Center map smoothly on marker
        this.map.panTo(new google.maps.LatLng(location.lat, location.lng));

        // Enhance pulse and avatar on click
        const clickIcon = await this.createRoundedImageIcon(
          profilePicUrl,
          44,
          '#FF0000', // Brighter red on click
          6, // Even thicker border
        );
        marker.setIcon(clickIcon);

        enhancePulsing();

        // Reset after 1 second
        setTimeout(async () => {
          marker.setIcon(baseIcon);
        }, 1000);
      });

      // Store marker with its animation controls
      this.markers.push({
        marker,
        location,
        talent,
        index,
        pulseRing1,
        pulseRing2,
        startPulsing,
        stopPulsing,
        pulseAnimation1,
        pulseAnimation2,
      });

      console.log(`📍 Modal Marker ${index} created at:`, {
        lat: location.lat,
        lng: location.lng,
        name: talent.name,
      });
    } catch (error) {
      console.error('Error creating talent marker:', error);

      // Fallback to simple colored marker
      this.createFallbackMarker(talent, location, index);
    }
  }

private showProfileCard(talent: any, marker: any, index: number): void {
  // Close any existing info window
  if (this.infoWindow) {
    this.infoWindow.close();
  }

  // Close any existing card overlay
  if ((this as any).currentCardElement) {
    this.closeProfileCardElement((this as any).currentCardElement);
  }

  this.selectedTalent = talent;
  this.cdr.detectChanges();

  // Create the profile card element
  const div = document.createElement('div');
  div.className = 'profile-card-overlay';
  div.style.position = 'fixed';
  div.style.width = '320px';
  div.style.minHeight = '220px';
  div.style.zIndex = '9999';
  div.style.pointerEvents = 'auto';
  div.style.opacity = '0';
  div.style.transition = 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)';
  div.style.top = '50%';
  div.style.left = '50%';
  div.style.transform = 'translate(-50%, -50%)';
  div.style.backgroundColor = 'white';
  div.style.borderRadius = '16px';
  div.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
  div.style.border = '2px solid #FF2D2D';
  div.style.overflow = 'hidden';

  // Get skills as skill tags
  const skillTags =
    talent.skillSet
      ?.slice(0, 3) // Show only first 3 skills
      .map((s: any) => s.jobTitle)
      .filter(Boolean) || [];

  // Create card HTML with inline styles
  div.innerHTML = `
    <div class="profile-card" style="position: relative; padding: 20px; height: 100%;">
      <!-- Close Button - positioned relative to the card -->
      <button class="close-card-btn" 
              aria-label="Close profile card"
              style="position: absolute; top: 8px; right: 8px; background: #f5f5f5; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; z-index: 10;">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M13 1L1 13M1 1L13 13" stroke="#666666" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      
      <!-- Card Header -->
      <div class="card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div class="avatar-container" style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 3px solid #FF2D2D;">
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
          <div class="skill-tags" style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${skillTags
              .map(
                (skill: any) => `
              <span class="skill-tag" style="background: #f0f0f0; color: #666; padding: 2px 8px; border-radius: 12px; font-size: 11px; white-space: nowrap;">
                ${skill}
              </span>
            `,
              )
              .join('')}
            ${talent.skillSet?.length > 3 ? `<span class="more-skills" style="color: #FF2D2D; font-size: 11px; font-weight: bold; margin-left: 4px;">+${talent.skillSet.length - 3} more</span>` : ''}
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <button class="view-profile-btn" 
              data-talent-id="${talent.id || index}"
              style="width: 100%; background: linear-gradient(135deg, #FF2D2D, #FF6B6B); color: white; border: none; border-radius: 12px; padding: 12px; font-weight: bold; cursor: pointer; transition: transform 0.2s; margin-top: auto;">
        View Profile
      </button>
    </div>
  `;

  // Add to body
  document.body.appendChild(div);

  // Store reference
  (this as any).currentCardElement = div;

  // Animate in
  setTimeout(() => {
    div.style.opacity = '1';
  }, 10);

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

    // Add click listener to document to close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeOnOutsideClick);
    }, 0);

    // Store the event listener for cleanup
    (div as any).outsideClickListener = closeOnOutsideClick;
  }, 50);
}

private closeProfileCardElement(cardElement: HTMLElement): void {
  if (cardElement) {
    cardElement.style.opacity = '0';

    // Remove event listener
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
      (this as any).currentCardElement = null;
    }, 250);
  }
}

  // Also update the closeProfileCard method to handle both approaches
  private closeProfileCard(cardOverlay?: any): void {
    if (cardOverlay && (cardOverlay as any).div) {
      const div = (cardOverlay as any).div;
      div.style.opacity = '0';
      div.style.transform = 'translateY(20px)';

      setTimeout(() => {
        cardOverlay.setMap(null);
        (this as any).currentCardOverlay = null;
      }, 250);
    }

    // Also close any card element
    if ((this as any).currentCardElement) {
      this.closeProfileCardElement((this as any).currentCardElement);
    }
  }


  private createFallbackMarker(
    talent: any,
    location: any,
    index: number,
  ): void {
    try {
      const colors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
      ];
      const color = colors[index % colors.length];

      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.lat, location.lng),
        map: this.map,
        title: talent.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#FF0000', // Red border
          strokeWeight: 3,
        },
        animation: google.maps.Animation.DROP,
        zIndex: 1000 + index,
        optimized: false,
      });

      // Add red pulse circle for fallback markers too
      const pulseCircle = new google.maps.Circle({
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.1,
        map: this.map,
        center: new google.maps.LatLng(location.lat, location.lng),
        radius: 30,
        visible: true,
      });

      // Create simple pulse animation for fallback - Use number for browser
      let pulseAnimation: number = setInterval(() => {
        const currentRadius = pulseCircle.getRadius();
        const newRadius = currentRadius === 30 ? 50 : 30;
        pulseCircle.setRadius(newRadius);

        const opacity = newRadius === 50 ? 0.3 : 0.1;
        pulseCircle.setOptions({
          fillOpacity: opacity,
          strokeOpacity: 0.5 + opacity,
        });
      }, 1000) as unknown as number; // Cast to number for browser

      marker.addListener('click', () => {
        this.showTalentInfo(talent, marker, index);
        this.map.panTo(new google.maps.LatLng(location.lat, location.lng));
      });

      this.markers.push({
        marker,
        location,
        talent,
        index,
        pulseCircle,
        pulseAnimation,
      });
    } catch (error) {
      console.error('Error creating fallback marker:', error);
    }
  }

  private showTalentInfo(talent: any, marker: any, index: number): void {
    this.infoWindow.close();
    this.selectedTalent = talent;
    this.cdr.detectChanges();

    try {
      // Get skills as comma-separated string (limit to 2 for cleaner display)
      const skillsText =
        talent.skillSet
          ?.slice(0, 2) // Show only first 2 skills
          .map((s: any) => s.jobTitle)
          .join(', ') || 'No skills listed';

      // Check if there are more skills
      const hasMoreSkills = talent.skillSet?.length > 2;

      const content = `
      <div class="bg-gray-900 text-white rounded-xl border-2 border-red-500 shadow-2xl overflow-hidden max-w-xs">
        <!-- Profile Header -->
        <div class="relative bg-gradient-to-r from-red-900/20 to-transparent p-3">
          <!-- Profile Content -->
          <div class="flex items-center gap-3">
            <!-- Profile Picture -->
            <div class="relative">
              <img src="${talent.profilePic || 'assets/images/default-avatar.png'}" 
                   class="w-12 h-12 rounded-full border-3 border-red-500 object-cover shadow-lg"
                   alt="${talent.name}"
                   onerror="this.src='assets/images/default-avatar.png'">
              <!-- Online Indicator -->
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            
            <!-- Name and Skills -->
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
        
        <!-- View Profile Button -->
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

      // Get marker position
      const markerPosition = marker.getPosition();

      // Find the marker info to get the stored location
      const markerInfo = this.markers.find((m) => m.marker === marker);
      const storedLocation = markerInfo?.location;

      // Position info window at bottom of screen
      const pixelOffset = new google.maps.Size(0, -50);

      this.infoWindow.setOptions({
        position: markerPosition,
        pixelOffset: pixelOffset,
      });

      this.infoWindow.open(this.map);

      // Center the map on the marker with offset for better visibility
      const markerPixelPos = this.getPixelPosition(markerPosition);
      if (markerPixelPos.y < 200) {
        // If marker is in top 200px, pan down
        this.map.panTo(
          new google.maps.LatLng(
            markerPosition.lat() + 0.002,
            markerPosition.lng(),
          ),
        );
      }

      // Add smooth zoom if needed
      setTimeout(() => {
        if (this.map.getZoom() < 14) {
          this.map.setZoom(14);
        }
      }, 300);

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

  // Helper method to get pixel position from lat/lng
  private getPixelPosition(latlng: google.maps.LatLng): {
    x: number;
    y: number;
  } {
    const projection = this.map.getProjection();
    const bounds = this.map.getBounds();

    if (!projection || !bounds || !bounds.contains(latlng)) {
      return { x: 0, y: 0 };
    }

    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const scale = Math.pow(2, this.map.getZoom());
    const point = projection.fromLatLngToPoint(latlng);

    return {
      x: (point.x - bottomLeft.x) * scale,
      y: (point.y - topRight.y) * scale,
    };
  }

  getMapHeight(): number {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 600; // Default height
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
        // Add padding to bounds to ensure markers aren't at the edge
        this.map.fitBounds(bounds, {
          top: 100,
          right: 100,
          bottom: 100,
          left: 100,
        });

        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
          if (validMarkers === 1 && this.map.getZoom() > 16) {
            this.map.setZoom(16); // Zoom in more for single marker
          } else if (validMarkers < 5 && this.map.getZoom() > 14) {
            this.map.setZoom(14); // Good zoom for few markers
          } else if (validMarkers > 20 && this.map.getZoom() < 12) {
            this.map.setZoom(12); // Zoom out for many markers
          }
        });
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  }

  private clearMarkers(): void {
    this.markers.forEach((markerInfo: any) => {
      try {
        // Clear marker
        if (markerInfo.marker && markerInfo.marker.setMap) {
          markerInfo.marker.setMap(null);
        }

        // Clear animation intervals
        if (markerInfo.pulseAnimation) {
          clearInterval(markerInfo.pulseAnimation);
        }

        // Stop pulsing functions
        if (
          markerInfo.stopPulsing &&
          typeof markerInfo.stopPulsing === 'function'
        ) {
          markerInfo.stopPulsing();
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
        this.infoWindow.close();
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

    this.navSub?.unsubscribe();
    this.mapInitialized = false;
  }
}
