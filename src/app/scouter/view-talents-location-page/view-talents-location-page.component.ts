import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { FindProfessionalsByLocationModalComponent } from 'src/app/utilities/modals/find-professionals-by-location-modal/find-professionals-by-location-modal.component';
import { ProceedToHireTalentPopupModalComponent } from 'src/app/utilities/modals/proceed-to-hire-talent-popup-modal/proceed-to-hire-talent-popup-modal.component';
import { ViewAllTalentsPopupModalComponent } from 'src/app/utilities/modals/view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { imageIcons } from 'src/app/models/stores';
import { Subscription } from 'rxjs';

// Import environment
import { environment } from 'src/environments/environment';
import { SharedTalentDataService } from 'src/app/services/shared-talent-data.service';

@Component({
  selector: 'app-view-talents-location-page',
  templateUrl: './view-talents-location-page.component.html',
  styleUrls: ['./view-talents-location-page.component.scss'],
  standalone: false,
})
export class ViewTalentsLocationPageComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private isMapInitializing = false;
  private mapInitialized = false;
  private mapResizeTimeout: any;

  private isAddingMarkers = false;

  // Google Maps properties
  map: any;
  mapError = false;
  markers: any[] = [];
  geocoder: any;
  infoWindow: any;

  // Data properties
  apiTalents: any[] = [];
  allSkills: string[] = [];
  searchQuery = '';

  // UI properties
  headerHidden = false;
  images = imageIcons;
  scouterName: string = '';
  scouterProfilePic: string = '';
  currentLocation: string = 'Lagos';
  activeTab: 'location' | 'skill' = 'location';
  showSkillSetTab = false;

  private debounceTimeout: any;
  private pendingMarkers = 0;
  private totalExpectedMarkers = 0;

  // Skills filter properties
  searchTerm = '';
  filteredSkills: string[] = [];
  selectedSkills: string[] = [];
  dropdownOpen = false;

  // Loading states
  loadingSkills = false;
  loadingTalents = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private platform: Platform,
    private scouterService: ScouterEndpointsService,
    private cdr: ChangeDetectorRef,
    private sharedData: SharedTalentDataService,
  ) {}

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

      // Use environment variable for API key
      const apiKey = environment.googleMapsApiKey;
      if (!apiKey) {
        console.error('Google Maps API key is not configured in environment');
        reject(new Error('Google Maps API key missing'));
        return;
      }

      const script = document.createElement('script');
      // Use environment variable in the script URL
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true; // Add defer attribute for better loading

      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  ngOnInit() {
    try {
      this.loadUserFromLocalStorage();
      this.fetchScouterProfile();
      this.loadGoogleMapsScript();

      // Initialize with empty arrays
      this.apiTalents = [];
      this.allSkills = [];
      this.filteredSkills = [];

      // Load skills first
      this.loadSkills();

      // Check if we have shared data first
      this.sharedData.currentTalents.subscribe((talents) => {
        if (talents.length > 0) {
          console.log(`📊 Received ${talents.length} shared talents`);

          // Transform the shared talents to ensure proper format
          const transformedTalents = this.transformApiResponse({
            talents: talents,
          });
          this.apiTalents = this.deduplicateTalents(transformedTalents);

          console.log(
            `✅ Processed ${this.apiTalents.length} talents from shared data`,
          );

          // Debug first talent
          if (this.apiTalents.length > 0) {
            console.log('🔍 First processed talent:', {
              name: this.apiTalents[0].name,
              address: this.apiTalents[0].address,
              skills: this.apiTalents[0].skillSet,
              skillSet: this.apiTalents[0].skillSet?.map(
                (s: any) => s.jobTitle,
              ),
            });
          }

          if (this.activeTab === 'location' && this.map) {
            this.addTalentMarkers(this.apiTalents);
          }
        } else {
          // Only load talents if no shared data
          console.log('📊 No shared talents, loading from API');
          this.loadTalents();
        }
      });

      this.sharedData.currentLocation.subscribe((location) => {
        if (location) {
          this.currentLocation = location;
          console.log(
            `📍 Updated current location from shared data: ${location}`,
          );
        }
      });
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.loadingTalents = false;
      this.loadingSkills = false;
    }
  }

  private deduplicateTalents(talents: any[]): any[] {
    const seen = new Set();
    return talents.filter((talent) => {
      const id = talent.talentId || talent.id;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  // Add this debug method to test the API
  debugBackendData(): void {
    console.log('🔍 Testing backend data...');

    // Test with different location parameters
    const testLocations = [
      'lagos',
      'Lagos',
      'Lagos, Nigeria',
      'lekki',
      'ikeja',
      'abuja',
      'port harcourt',
      'kano',
      '', // Empty to get all talents
    ];

    testLocations.forEach((location, index) => {
      setTimeout(() => {
        this.scouterService
          .fetchAllTalents({
            location: location,
            limit: 100,
            pageNo: 1,
          })
          .subscribe({
            next: (response) => {
              console.log(`📍 "${location}":`, {
                talentsCount: this.transformApiResponse(response).length,
                hasData: !!response.data,
                totals: response.paginationParams?.totals || 0,
              });
            },
            error: (error) => {
              console.error(`❌ "${location}":`, error.message);
            },
          });
      }, index * 1000);
    });
  }

  ngAfterViewInit(): void {
    console.log('✅ AfterViewInit called, activeTab:', this.activeTab);
    if (this.activeTab === 'location') {
      // Give a bit more time for DOM to render
      setTimeout(() => {
        console.log('🔄 Initializing map with talents...');
        this.initializeMapWithTalents();
      }, 300);
    }
  }

  private loadUserFromLocalStorage() {
    try {
      let userData = null;

      const userProfileData = localStorage.getItem('user_profile_data');
      if (userProfileData) {
        userData = JSON.parse(userProfileData);
        console.log('Found user data in user_profile_data:', userData);
      } else {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
          console.log('Found user data in user_data:', userData);
        }
      }

      if (userData) {
        if (userData.fullName) {
          this.scouterName = userData.fullName;
        } else if (userData.name) {
          this.scouterName = userData.name;
        } else if (userData.firstName && userData.lastName) {
          this.scouterName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.username) {
          this.scouterName = userData.username;
        } else if (userData.email) {
          this.scouterName = userData.email.split('@')[0];
        }

        if (userData.profilePicture) {
          this.scouterProfilePic = userData.profilePicture;
        } else if (userData.avatar) {
          this.scouterProfilePic = userData.avatar;
        } else if (userData.imageUrl) {
          this.scouterProfilePic = userData.imageUrl;
        }

        console.log('Loaded user from localStorage:', this.scouterName);
        this.cdr.detectChanges();
      } else {
        console.log('No user data found in localStorage');
        this.scouterName = 'Scouter';
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      this.scouterName = 'Scouter';
    }
  }

  private async fetchScouterProfile() {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const scouterId = payload.scouterId || payload.userId;

        if (scouterId) {
          this.scouterService.fetchScouterProfile(scouterId).subscribe({
            next: (response) => {
              if (response.details?.fullName) {
                if (!this.scouterName || this.scouterName === 'Scouter') {
                  this.scouterName = response.details.fullName;
                  this.cdr.detectChanges();
                }
              }

              if (response.details?.profilePicture) {
                this.scouterProfilePic = response.details.profilePicture;
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              console.warn('Could not fetch scouter profile:', error);
            },
          });
        }
      }
    } catch (error) {
      console.warn('Could not parse token:', error);
    }
  }

  private async initGoogleMap() {
    if (this.mapError) {
      this.mapError = false;
    }

    if (!this.mapContainer?.nativeElement) {
      console.error('Map container not found');
      return;
    }

    try {
      if (typeof google === 'undefined' || !google.maps) {
        await this.loadGoogleMapsScript();
      }

      const defaultCenter = { lat: 6.5244, lng: 3.3792 };

      if (this.map && this.mapInitialized) {
        console.log('Map exists, checking if container is valid');
        try {
          this.forceMapResize();
          return;
        } catch (e) {
          console.log('Map container might be invalid, reinitializing...');
        }
      }

      this.map = new google.maps.Map(this.mapContainer.nativeElement, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      });

      this.geocoder = new google.maps.Geocoder();
      this.infoWindow = new google.maps.InfoWindow();
      this.mapInitialized = true;

      setTimeout(() => {
        this.forceMapResize();

        if (this.apiTalents.length > 0) {
          this.addTalentMarkers(this.apiTalents);
        } else {
          this.map.setCenter(defaultCenter);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      this.mapError = true;
      this.cdr.detectChanges();
    }
  }

  private forceMapResize() {
    if (!this.map) return;

    if (this.mapResizeTimeout) {
      clearTimeout(this.mapResizeTimeout);
    }

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 50);

    this.mapResizeTimeout = setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
        if (this.markers.length > 0) {
          this.fitMapBounds();
        } else {
          this.map.setCenter({ lat: 6.5244, lng: 3.3792 });
          this.map.setZoom(12);
        }
      }
    }, 300);
  }

  async performSearch() {
    const query = this.searchQuery.toLowerCase().trim();

    if (!query) {
      this.currentLocation = 'Lagos'; // Default
      this.loadTalents();
      return;
    }

    this.loadingTalents = true;
    this.currentLocation = query; // Set current location FIRST

    const subscription = this.scouterService
      .fetchAllTalents({
        location: query,
        limit: 50,
        pageNo: 1,
      })
      .subscribe({
        next: (response) => {
          this.loadingTalents = false;
          this.apiTalents = this.transformApiResponse(response);

          if (this.activeTab !== 'location') {
            this.openLocationTab();
          } else {
            this.addTalentMarkers(this.apiTalents); // Use ALL talents
          }

          this.cdr.detectChanges();

          // Open modal with ALL talents
          this.openModalWithFilteredResults(
            this.apiTalents,
            this.currentLocation,
          );
        },
        error: (error) => {
          this.loadingTalents = false;
          console.error('Search failed:', error);
          this.clientSideSearchFallback(query);
        },
      });

    this.subscriptions.add(subscription);
  }

  private clientSideSearchFallback(query: string) {
    const filtered = this.apiTalents.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(query);
      const skillMatch = t.skillSet?.some((s: any) =>
        s.jobTitle.toLowerCase().includes(query),
      );
      const locationMatch = t.proximity?.toLowerCase().includes(query);
      return nameMatch || skillMatch || locationMatch;
    });

    if (this.activeTab !== 'location') {
      this.openLocationTab();
    } else {
      if (this.map) {
        this.addTalentMarkers(filtered);
      }
    }

    this.currentLocation = query || 'Search Results';
    this.cdr.detectChanges();

    this.openModalWithFilteredResults(filtered, this.currentLocation);
  }

  private addTalentMarkers(talents: any[]) {
    if (this.isAddingMarkers) {
      console.log('⚠️ Already adding markers, skipping...');
      return;
    }

    this.isAddingMarkers = true;
    this.totalExpectedMarkers = talents.length;
    this.pendingMarkers = talents.length;

    if (!this.map || talents.length === 0) {
      console.log('⚠️ No map or talents to display');
      this.isAddingMarkers = false;
      this.pendingMarkers = 0;
      return;
    }

    console.log(`📍 Adding ${talents.length} talents to map`);
    console.log(
      `📊 Expected markers: ${this.totalExpectedMarkers}, Pending: ${this.pendingMarkers}`,
    );

    // Process talents in batches
    this.processTalentsInBatches(talents, 3); // Reduced batch size to 3
  }

  private async processTalentsInBatches(talents: any[], batchSize: number) {
    const totalTalents = talents.length;
    console.log(
      `🔄 Processing ${totalTalents} talents in batches of ${batchSize}`,
    );

    // Clear existing markers first
    this.clearMarkers();

    // Create an array to store all marker promises
    const markerPromises: Promise<void>[] = [];

    for (let i = 0; i < totalTalents; i += batchSize) {
      const batch = talents.slice(i, i + batchSize);

      // Process each talent in the batch
      for (let j = 0; j < batch.length; j++) {
        const talent = batch[j];
        const talentIndex = i + j;

        // Create a promise for each talent marker
        const markerPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            this.addMarkerForTalent(talent, talentIndex);
            resolve();
          }, j * 100); // Reduced delay for better UX
        });

        markerPromises.push(markerPromise);
      }

      // Wait for the entire batch to complete before proceeding
      await Promise.all(markerPromises.slice(-batch.length));

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.isAddingMarkers = false;
    console.log(`✅ Finished adding all ${totalTalents} markers`);

    // Call fitMapBounds after ALL markers are created
    setTimeout(() => {
      this.fitMapBounds();
      this.debugMarkers();
    }, 500);
  }

  private addMarkerForTalent(talent: any, index: number) {
    const address =
      talent.address ||
      talent.proximity ||
      this.currentLocation ||
      'Lagos, Nigeria';

    // Add a unique ID to prevent duplicate markers
    const markerId = `${talent.id || talent.talentId || index}-${Date.now()}`;

    this.geocodeAddress(address, index)
      .then((location) => {
        this.createTalentMarker(talent, location, markerId, index);
        this.debouncedFitBounds(); // Call after each marker is created
      })
      .catch((error) => {
        // Even more randomized fallback
        const defaultLocation = new google.maps.LatLng(
          6.5244 + (Math.random() * 0.03 - 0.015) + index * 0.001,
          3.3792 + (Math.random() * 0.03 - 0.015) + index * 0.001,
        );
        this.createTalentMarker(talent, defaultLocation, markerId, index);
        this.debouncedFitBounds(); // Call after each marker is created
      });
  }

  private refreshMapView() {
    if (!this.map) return;

    // Force map refresh
    setTimeout(() => {
      if (this.markers.length > 0) {
        this.fitMapBounds();
      } else {
        // Default to Lagos center
        this.map.setCenter({ lat: 6.5244, lng: 3.3792 });
        this.map.setZoom(12);
      }

      // Trigger resize event
      google.maps.event.trigger(this.map, 'resize');
    }, 1000);
  }

  private geocodeAddress(address: string, index: number): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        this.geocoder = new google.maps.Geocoder();
      }

      // Clean up the address
      const cleanAddress = address
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,$/, '')
        .replace(/Lagos Nigeria, Nigeria/, 'Lagos, Nigeria');

      console.log(`🌍 [${index}] Geocoding: "${cleanAddress}"`);

      this.geocoder.geocode(
        { address: cleanAddress },
        (results: any, status: any) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            console.log(
              `✅ [${index}] Geocoded:`,
              location.lat(),
              location.lng(),
            );

            // Check if we've already used these coordinates
            const existingCoords = this.markers
              .map((m) => m.position)
              .filter(Boolean)
              .map((pos) => ({
                lat: typeof pos.lat === 'function' ? pos.lat() : pos.lat,
                lng: typeof pos.lng === 'function' ? pos.lng() : pos.lng,
              }));

            // If coordinates already exist, add a small offset
            const isDuplicate = existingCoords.some(
              (coord) =>
                Math.abs(coord.lat - location.lat()) < 0.0001 &&
                Math.abs(coord.lng - location.lng()) < 0.0001,
            );

            if (isDuplicate) {
              console.log(
                `⚠️ [${index}] Duplicate coordinates detected, adding offset`,
              );
              // Add unique offset based on index (0.0001 degrees ≈ 11 meters)
              const offset = 0.0001;
              const offsetLat = location.lat() + index * offset * 0.7;
              const offsetLng = location.lng() + index * offset * 1.3;

              const uniqueLocation = new google.maps.LatLng(
                offsetLat,
                offsetLng,
              );
              console.log(`📍 [${index}] Adjusted to unique location:`, {
                original: { lat: location.lat(), lng: location.lng() },
                adjusted: { lat: offsetLat, lng: offsetLng },
              });
              resolve(uniqueLocation);
            } else {
              resolve(location);
            }
          } else {
            console.warn(
              `⚠️ [${index}] Geocoding failed, using randomized location`,
            );

            // Create unique but clustered locations based on index
            const baseCoords = {
              lagos: { lat: 6.5244, lng: 3.3792 },
              abuja: { lat: 9.0765, lng: 7.3986 },
              'port harcourt': { lat: 4.8156, lng: 7.0498 },
              default: { lat: 9.082, lng: 8.6753 },
            };

            let base = baseCoords.default;
            const lowerAddress = address.toLowerCase();

            if (lowerAddress.includes('lagos')) base = baseCoords.lagos;
            else if (lowerAddress.includes('abuja')) base = baseCoords.abuja;
            else if (
              lowerAddress.includes('port harcourt') ||
              lowerAddress.includes('ph')
            )
              base = baseCoords['port harcourt'];

            // Systematic offset based on index to ensure separation
            const angle = index * 137.5 * (Math.PI / 180); // Golden angle
            const radius = 0.005 * (index + 1); // Increasing radius

            const offsetLat = Math.cos(angle) * radius;
            const offsetLng = Math.sin(angle) * radius;

            const randomLocation = new google.maps.LatLng(
              base.lat + offsetLat,
              base.lng + offsetLng,
            );

            console.log(`📍 [${index}] Randomized:`, {
              lat: randomLocation.lat(),
              lng: randomLocation.lng(),
              angle: angle * (180 / Math.PI),
              radius: radius,
            });

            resolve(randomLocation);
          }
        },
      );
    });
  }

  private createTalentMarker(
    talent: any,
    location: any,
    markerId: string,
    index: number,
  ) {
    if (!this.map || !google.maps) {
      console.error(
        '❌ Cannot create marker - map or Google Maps not available',
      );
      return;
    }

    try {
      console.log(`📍 Creating marker for "${talent.name}" at:`, {
        lat: location.lat ? location.lat() : location.lat,
        lng: location.lng ? location.lng() : location.lng,
      });

      // Check if marker already exists for this talent
      const existingMarkerIndex = this.markers.findIndex(
        (m) => m.talentId === talent.talentId || m.id === markerId,
      );

      if (existingMarkerIndex > -1) {
        console.log(`🔄 Updating existing marker for ${talent.name}`);
        // Remove old marker
        this.markers[existingMarkerIndex].marker.setMap(null);
        this.markers.splice(existingMarkerIndex, 1);
      }

      const marker = new google.maps.Marker({
        position: location,
        map: this.map,
        title: talent.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: this.getMarkerColor(index), // Different colors for visibility
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        console.log(`🎯 Marker clicked: ${talent.name}`);
        this.showTalentInfo(talent, marker);
      });

      // Store with metadata
      this.markers.push({
        marker: marker,
        talentId: talent.talentId,
        id: markerId,
        talentName: talent.name,
        position: location,
        index: index, // Store index for reference
      });

      console.log(`✅ Marker ${markerId} created for ${talent.name}`);

      // Debounce the fitBounds to avoid multiple calls
      this.debouncedFitBounds();
    } catch (error) {
      console.error(`❌ Error creating marker for ${talent.name}:`, error);
    }
  }

  private getMarkerColor(index: number): string {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
    ];
    return colors[index % colors.length];
  }

  private debouncedFitBounds() {
    this.pendingMarkers--;

    // Only fit bounds when all markers are done
    if (this.pendingMarkers > 0) {
      return;
    }

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.fitMapBounds();
    }, 800); // Increased delay to ensure all markers are ready
  }

  private showTalentInfo(talent: any, marker: any) {
    this.infoWindow.close();

    try {
      const content = `
      <div class="p-2 max-w-xs">
        <div class="flex items-center gap-3 mb-2">
          <img src="${talent.profilePic || 'assets/images/default-avatar.png'}" 
               class="w-10 h-10 rounded-full" alt="${talent.name}">
          <div>
            <h3 class="font-bold text-gray-800">${talent.name}</h3>
            <p class="text-sm text-gray-600">${talent.skillSet?.[0]?.jobTitle || 'Professional'}</p>
          </div>
        </div>
        <div class="text-sm space-y-1">
          <p><strong>Skills:</strong> ${talent.skillSet?.map((s: any) => s.jobTitle).join(', ') || 'N/A'}</p>
          <p><strong>Pay Range:</strong> ${talent.payRange || 'N/A'}</p>
          <p><strong>Location:</strong> ${talent.proximity || 'N/A'}</p>
          <button id="view-profile-${talent.talentId}"
                  class="mt-2 w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition">
            View Profile
          </button>
        </div>
      </div>
    `;

      this.infoWindow.setContent(content);
      this.infoWindow.open(this.map, marker);

      setTimeout(() => {
        const button = document.getElementById(
          `view-profile-${talent.talentId}`,
        );
        if (button) {
          button.addEventListener('click', () => {
            this.openTalentModal(talent);
            this.infoWindow.close();
          });
        }
      }, 50);
    } catch (error) {
      console.error('Error showing talent info:', error);
    }
  }

  private logMarkerPositions() {
    console.log('📊 MARKER POSITIONS:');
    this.markers.forEach((markerInfo, index) => {
      if (markerInfo.marker && markerInfo.marker.getPosition) {
        const pos = markerInfo.marker.getPosition();
        console.log(`  ${index}: ${markerInfo.talentName || 'Unknown'}`, {
          lat: pos?.lat(),
          lng: pos?.lng(),
        });
      }
    });
  }

  private fitMapBounds() {
    if (this.markers.length === 0 || !this.map || !google.maps) {
      console.log('⚠️ Cannot fit bounds - no markers or map');
      return;
    }

    try {
      console.log(
        `📊 Attempting to fit bounds for ${this.markers.length} markers`,
      );

      const bounds = new google.maps.LatLngBounds();
      let validMarkers = 0;

      this.markers.forEach((markerInfo, index) => {
        try {
          if (markerInfo.marker && markerInfo.marker.getPosition) {
            const position = markerInfo.marker.getPosition();
            if (position) {
              bounds.extend(position);
              validMarkers++;
              console.log(
                `📍 Marker ${index} added to bounds:`,
                markerInfo.talentName,
                { lat: position.lat(), lng: position.lng() },
              );
            } else {
              console.warn(
                `⚠️ Marker ${index} (${markerInfo.talentName}) has no position`,
              );
            }
          } else {
            console.warn(
              `⚠️ Marker ${index} (${markerInfo.talentName}) has invalid marker object`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Error getting position for marker ${index} (${markerInfo.talentName}):`,
            error,
          );
        }
      });

      if (validMarkers > 0) {
        console.log(
          `📍 Fitting bounds for ${validMarkers} valid markers (total: ${this.markers.length})`,
        );

        // Fit bounds with padding
        this.map.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        });

        // Set appropriate zoom level
        setTimeout(() => {
          const currentZoom = this.map.getZoom();
          if (validMarkers === 1 && currentZoom > 15) {
            this.map.setZoom(15);
          } else if (validMarkers < 3 && currentZoom > 13) {
            this.map.setZoom(13);
          } else if (validMarkers > 10 && currentZoom < 10) {
            this.map.setZoom(10);
          }

          console.log(
            `✅ Map bounds fitted. Current zoom: ${this.map.getZoom()}`,
          );
        }, 100);
      } else {
        console.warn('⚠️ No valid markers to fit bounds');
        // Center on default location
        this.map.setCenter({ lat: 6.5244, lng: 3.3792 });
        this.map.setZoom(12);
      }
    } catch (error) {
      console.error('❌ Error fitting map bounds:', error);
      // Fallback to default center
      this.map.setCenter({ lat: 6.5244, lng: 3.3792 });
      this.map.setZoom(12);
    }
  }

  private clearMarkers() {
    console.log(`🗑️ Clearing ${this.markers.length} markers`);

    this.markers.forEach((markerInfo) => {
      try {
        if (markerInfo.marker && markerInfo.marker.setMap) {
          markerInfo.marker.setMap(null);
        }
      } catch (error) {
        console.error('Error clearing marker:', error);
      }
    });

    this.markers = [];
    this.pendingMarkers = 0;
    this.totalExpectedMarkers = 0;

    if (this.infoWindow) {
      this.infoWindow.close();
    }
  }

  private loadSkills() {
    this.loadingSkills = true;

    const subscription = this.scouterService.fetchAllSkillsets().subscribe({
      next: (response) => {
        this.loadingSkills = false;
        this.allSkills = response.data || [];
        this.filteredSkills = [...this.allSkills];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loadingSkills = false;
        console.error('Failed to load skills:', error);
        this.allSkills = [
          'Web Development',
          'Design',
          'Marketing',
          'Writing',
          'Consulting',
        ];
        this.filteredSkills = [...this.allSkills];
        this.cdr.detectChanges();
      },
    });

    this.subscriptions.add(subscription);
  }

  private loadTalents() {
    this.loadingTalents = true;

    // Use the SAME parameters as the table component
    const params: any = {
      limit: 50,
      pageNo: 1,
      location: this.currentLocation || 'Lagos', // Always send location
    };

    // Don't add skillset unless in skill tab
    if (this.activeTab === 'skill' && this.selectedSkills.length > 0) {
      params.skillset = this.selectedSkills;
    }

    console.log('📊 Loading talents with params:', params);

    const subscription = this.scouterService.fetchAllTalents(params).subscribe({
      next: (response) => {
        this.loadingTalents = false;
        this.apiTalents = this.transformApiResponse(response);
        this.cdr.detectChanges();

        console.log(
          `✅ Loaded ${this.apiTalents.length} talents for ${this.currentLocation}`,
        );

        if (this.activeTab === 'location') {
          this.initializeMapWithTalents();
        }
      },
      error: (error) => {
        this.loadingTalents = false;
        console.error('Failed to load talents:', error);
        this.apiTalents = [];
        this.cdr.detectChanges();
      },
    });

    this.subscriptions.add(subscription);
  }

  // ====== REMOVE -=====
  debugMarkers() {
    console.log('🔍 MARKER DEBUG:', {
      totalMarkers: this.markers.length,
      expectedMarkers: this.totalExpectedMarkers,
      pendingMarkers: this.pendingMarkers,
      markers: this.markers.map((m, index) => ({
        index: index,
        name: m.talentName,
        id: m.id,
        talentId: m.talentId,
        position: m.position,
        markerExists: !!m.marker,
        mapExists: m.marker?.getMap() === this.map,
      })),
      mapStatus: {
        exists: !!this.map,
        center: this.map?.getCenter()?.toString(),
        zoom: this.map?.getZoom(),
      },
    });
  }

  initializeMapWithTalents() {
    if (
      this.activeTab !== 'location' ||
      this.isMapInitializing ||
      this.isAddingMarkers
    ) {
      return;
    }

    this.isMapInitializing = true;

    const initMap = async () => {
      try {
        await this.loadGoogleMapsScript();

        if (!this.mapContainer?.nativeElement) {
          console.error('Map container not found');
          return;
        }

        if (!this.map || !this.mapInitialized) {
          await this.initGoogleMap();
        }

        if (this.map && this.apiTalents.length > 0) {
          console.log(`🔄 Adding ${this.apiTalents.length} markers to map`);
          this.addTalentMarkers(this.apiTalents);

          // Refresh map after a delay
          setTimeout(() => {
            this.refreshMapView();
          }, 1500);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      } finally {
        this.isMapInitializing = false;
      }
    };

    setTimeout(() => initMap(), 300);
  }

  private fixNairaEncoding(text: string): string {
    if (!text || typeof text !== 'string') return text;

    return text
      .replace(/â\x82¦/g, '₦')
      .replace(/â‚¦/g, '₦')
      .replace(/â€Â¦/g, '₦')
      .replace(/\u00a3/g, '₦')
      .replace(/\\u20a6/g, '₦')
      .replace(/&#8358;/g, '₦')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  private formatPayRange(payRange: string): string {
    if (!payRange) return '₦50,000 - ₦150,000';
    return this.fixNairaEncoding(
      payRange.includes('₦') ? payRange : `₦${payRange}`,
    );
  }

  private calculateAmount(payRange: string, skillLevel: string): number {
    if (!payRange) return 50000;

    const matches = payRange.match(/\d+/g);
    if (matches && matches.length > 0) {
      const num = parseInt(matches[0], 10);
      if (payRange.toLowerCase().includes('k')) {
        return num * 1000;
      }
      return num;
    }

    const multipliers: { [key: string]: number } = {
      Beginner: 30000,
      Intermediate: 50000,
      Expert: 80000,
      'Mid-level-Experienced': 60000,
    };

    return multipliers[skillLevel] || 50000;
  }

  private mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: 'Active',
      inactive: 'Away',
      pending: 'Pending',
      available: 'Active',
    };
    return statusMap[status?.toLowerCase()] || 'Active';
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.filteredSkills = this.allSkills.filter(
      (skill) => !this.selectedSkills.includes(skill),
    );
  }

  toggleSkill(skill: string) {
    if (this.selectedSkills.includes(skill)) {
      this.selectedSkills = this.selectedSkills.filter((s) => s !== skill);
    } else {
      this.selectedSkills.push(skill);
    }
    this.searchTerm = '';
    this.filterSkills();
  }

  filterSkills() {
    this.filteredSkills = this.allSkills.filter((skill) =>
      skill.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );
  }

  get dropdownSkills(): string[] {
    const selectedNotInFiltered = this.selectedSkills.filter(
      (s) => !this.filteredSkills.includes(s),
    );
    return [...this.filteredSkills, ...selectedNotInFiltered];
  }

  removeSkill(skill: string) {
    this.selectedSkills = this.selectedSkills.filter((s) => s !== skill);
    this.filteredSkills = this.allSkills.filter(
      (s) => !this.selectedSkills.includes(s),
    );
  }

  openSkillSetTab() {
    this.activeTab = 'skill';
    this.showSkillSetTab = true;
    this.refreshDataForTab();
    this.cdr.detectChanges();
  }

  openLocationTab() {
    this.activeTab = 'location';
    this.showSkillSetTab = false;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.initializeMapWithTalents();
    }, 300);
  }

  async openFindProfessionalsByLocationModal() {
    if (this.activeTab !== 'location') {
      this.openLocationTab();
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    this.loadingTalents = true;

    const subscription = this.scouterService
      .fetchAllTalents({
        location: this.currentLocation,
        limit: 100,
        pageNo: 1,
      })
      .subscribe({
        next: (response) => {
          this.loadingTalents = false;

          console.log('🌍 API Response for modal:', response);

          let hires = [];

          // Try multiple response structures
          if (response.decodedData && response.decodedData.mappedTalents) {
            hires = this.transformApiResponse(response);
            console.log(
              `🌍 Got ${hires.length} hires from decodedData.mappedTalents`,
            );
          } else if (response.mappedTalents) {
            hires = this.mapTalentsToFormat(response.mappedTalents);
            console.log(`🌍 Got ${hires.length} hires from mappedTalents`);
          } else if (response.data && typeof response.data === 'string') {
            hires = this.decodeAndTransformResponse(response);
            console.log(
              `🌍 Got ${hires.length} hires from decoded base64 data`,
            );
          } else if (response.talents) {
            hires = this.mapTalentsToFormat(response.talents);
            console.log(`🌍 Got ${hires.length} hires from talents`);
          } else {
            // Fallback to current apiTalents
            hires = [...this.apiTalents];
            console.log(`🌍 Using current apiTalents: ${hires.length} hires`);
          }

          console.log('🌍 Passing to modal:', {
            location: this.currentLocation,
            hiresCount: hires.length,
            hiresSample: hires
              .slice(0, 3)
              .map((h) => ({ name: h.name, address: h.address })),
          });

          // Create the new modal with dark blurry map
          this.modalCtrl
            .create({
              component: FindProfessionalsByLocationModalComponent,
              componentProps: {
                hires: hires,
                location: this.currentLocation || 'Unknown',
                allSkills: this.allSkills,
              },
              cssClass: 'dark-blurry-map-modal',
              backdropDismiss: true,
              showBackdrop: true,
            })
            .then((modal) => {
              modal.present();
              modal.onDidDismiss().then(() => {
                this.refreshMap();
              });
            });
        },
        error: (error) => {
          this.loadingTalents = false;
          console.error('❌ Failed to load location hires:', error);
          // Fallback to current talents
          this.modalCtrl
            .create({
              component: FindProfessionalsByLocationModalComponent,
              componentProps: {
                hires: [...this.apiTalents],
                location: this.currentLocation || 'Unknown',
                allSkills: this.allSkills,
              },
              cssClass: 'dark-blurry-map-modal',
              backdropDismiss: true,
              showBackdrop: true,
            })
            .then((modal) => modal.present());
        },
      });

    this.subscriptions.add(subscription);
  }

  private decodeAndTransformResponse(response: any): any[] {
    try {
      const decodedString = atob(response.data);
      const decodedData = JSON.parse(decodedString);

      if (decodedData.mappedTalents) {
        return this.mapTalentsToFormat(decodedData.mappedTalents);
      } else if (decodedData.talents) {
        return this.mapTalentsToFormat(decodedData.talents);
      }

      return [];
    } catch (error) {
      console.error('Failed to decode response:', error);
      return [];
    }
  }

  // In ViewTalentsLocationPageComponent, update the transformApiResponse method:

  private transformApiResponse(apiResponse: any): any[] {
    if (!apiResponse) return [];

    console.log('📊 Processing API response structure:', {
      keys: Object.keys(apiResponse),
      hasDecodedData: !!apiResponse.decodedData,
      hasTalents: !!apiResponse.talents,
      hasMappedTalents: !!apiResponse.mappedTalents,
      hasData: !!apiResponse.data,
      dataType: typeof apiResponse.data,
    });

    // ============ TRY MULTIPLE RESPONSE STRUCTURES ============

    // 1. Check for decodedData first (most common)
    if (apiResponse.decodedData) {
      console.log('📊 Found decodedData structure');

      if (
        apiResponse.decodedData.mappedTalents &&
        Array.isArray(apiResponse.decodedData.mappedTalents)
      ) {
        const mapped = this.mapTalentsToFormat(
          apiResponse.decodedData.mappedTalents,
        );
        console.log(
          `📊 Mapped ${mapped.length} talents from decodedData.mappedTalents`,
        );
        return mapped;
      }

      if (
        apiResponse.decodedData.talents &&
        Array.isArray(apiResponse.decodedData.talents)
      ) {
        const mapped = this.mapTalentsToFormat(apiResponse.decodedData.talents);
        console.log(
          `📊 Mapped ${mapped.length} talents from decodedData.talents`,
        );
        return mapped;
      }

      // Check if decodedData itself is an array
      if (Array.isArray(apiResponse.decodedData)) {
        const mapped = this.mapTalentsToFormat(apiResponse.decodedData);
        console.log(
          `📊 Mapped ${mapped.length} talents from decodedData array`,
        );
        return mapped;
      }
    }

    // 2. Check for direct talents array
    if (apiResponse.talents && Array.isArray(apiResponse.talents)) {
      const mapped = this.mapTalentsToFormat(apiResponse.talents);
      console.log(
        `📊 Mapped ${mapped.length} talents from direct talents array`,
      );
      return mapped;
    }

    // 3. Check for mappedTalents directly
    if (apiResponse.mappedTalents && Array.isArray(apiResponse.mappedTalents)) {
      const mapped = this.mapTalentsToFormat(apiResponse.mappedTalents);
      console.log(
        `📊 Mapped ${mapped.length} talents from mappedTalents array`,
      );
      return mapped;
    }

    // 4. Handle base64 encoded data
    if (apiResponse.data && typeof apiResponse.data === 'string') {
      try {
        console.log('📊 Attempting to decode base64 data...');
        const decodedString = atob(apiResponse.data);
        const decodedData = JSON.parse(decodedString);
        console.log('📊 Decoded data structure:', {
          keys: Object.keys(decodedData),
          isArray: Array.isArray(decodedData),
        });

        // Check if the decoded data contains talents
        if (
          decodedData.mappedTalents &&
          Array.isArray(decodedData.mappedTalents)
        ) {
          const mapped = this.mapTalentsToFormat(decodedData.mappedTalents);
          console.log(
            `📊 Mapped ${mapped.length} talents from decoded base64 mappedTalents`,
          );
          return mapped;
        }

        if (decodedData.talents && Array.isArray(decodedData.talents)) {
          const mapped = this.mapTalentsToFormat(decodedData.talents);
          console.log(
            `📊 Mapped ${mapped.length} talents from decoded base64 talents`,
          );
          return mapped;
        }

        // Check if decodedData itself is an array
        if (Array.isArray(decodedData)) {
          const mapped = this.mapTalentsToFormat(decodedData);
          console.log(
            `📊 Mapped ${mapped.length} talents from decoded base64 array`,
          );
          return mapped;
        }
      } catch (error) {
        console.error('❌ Failed to decode/parse response.data:', error);
        console.error(
          'Raw data (first 200 chars):',
          apiResponse.data.substring(0, 200),
        );
      }
    }

    // 5. Check if data is already an object with talent info
    if (
      apiResponse.data &&
      typeof apiResponse.data === 'object' &&
      !Array.isArray(apiResponse.data)
    ) {
      console.log('📊 data is an object, checking for talent arrays...');

      if (
        apiResponse.data.mappedTalents &&
        Array.isArray(apiResponse.data.mappedTalents)
      ) {
        const mapped = this.mapTalentsToFormat(apiResponse.data.mappedTalents);
        console.log(
          `📊 Mapped ${mapped.length} talents from data.mappedTalents`,
        );
        return mapped;
      }

      if (apiResponse.data.talents && Array.isArray(apiResponse.data.talents)) {
        const mapped = this.mapTalentsToFormat(apiResponse.data.talents);
        console.log(`📊 Mapped ${mapped.length} talents from data.talents`);
        return mapped;
      }
    }

    // 6. Handle pagination response structure
    if (apiResponse.paginationParams && apiResponse.mappedTalents) {
      const mapped = this.mapTalentsToFormat(apiResponse.mappedTalents);
      console.log(
        `📊 Mapped ${mapped.length} talents from pagination structure`,
      );
      return mapped;
    }

    // 7. Check if the entire response is an array of talents
    if (Array.isArray(apiResponse)) {
      console.log('📊 API response is an array, assuming it contains talents');
      const mapped = this.mapTalentsToFormat(apiResponse);
      console.log(`📊 Mapped ${mapped.length} talents from array response`);
      return mapped;
    }

    console.warn(
      '⚠️ No talent data found in API response. Response structure:',
      {
        type: typeof apiResponse,
        keys: Object.keys(apiResponse || {}),
        sampleData: JSON.stringify(apiResponse).substring(0, 500),
      },
    );

    return [];
  }

  // Also update the mapTalentsToFormat method to handle your API structure better:
  private mapTalentsToFormat(talents: any[]): any[] {
    if (!talents || !Array.isArray(talents)) {
      console.warn('⚠️ No talents array provided to mapTalentsToFormat');
      return [];
    }

    console.log(`📊 Mapping ${talents.length} talents to format`);
    console.log('🔍 Sample raw talent data:', talents[0]);

    return talents
      .map((talent: any, index: number) => {
        try {
          // Debug the talent structure
          console.log(`🔍 Processing talent ${index}:`, {
            talentId: talent.talentId,
            fullName: talent.fullName,
            skillSets: talent.skillSets,
            address: talent.address,
            _rawKeys: Object.keys(talent),
          });

          // ============ FIX: PROPERLY EXTRACT SKILLSETS ============
          let skills = [];

          // First, check for skillSets in various formats
          if (talent.skillSets) {
            console.log('🔍 Found skillSets:', talent.skillSets);

            if (typeof talent.skillSets === 'string') {
              try {
                // Try to parse as JSON
                const parsed = JSON.parse(talent.skillSets);
                if (Array.isArray(parsed)) {
                  skills = parsed;
                  console.log('✅ Parsed skills from JSON string:', skills);
                } else if (typeof parsed === 'string') {
                  // If it's a comma-separated string
                  skills = parsed
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s);
                }
              } catch (e) {
                console.log('⚠️ Could not parse skillSets as JSON:', e);
                // Try comma-separated string
                skills = talent.skillSets
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s);
              }
            } else if (Array.isArray(talent.skillSets)) {
              skills = talent.skillSets;
              console.log('✅ Using skillSets array directly:', skills);
            }
          }

          // Fallback: Check for skillSet (singular)
          if (skills.length === 0 && talent.skillSet) {
            console.log('🔍 Trying skillSet:', talent.skillSet);
            if (typeof talent.skillSet === 'string') {
              skills = talent.skillSet
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s);
            } else if (Array.isArray(talent.skillSet)) {
              skills = talent.skillSet;
            }
          }

          // Fallback: Check for skills field
          if (skills.length === 0 && talent.skills) {
            console.log('🔍 Trying skills:', talent.skills);
            if (typeof talent.skills === 'string') {
              skills = talent.skills
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s);
            } else if (Array.isArray(talent.skills)) {
              skills = talent.skills;
            }
          }

          // If still no skills, check for jobTitle or jobTitles
          if (skills.length === 0 && talent.jobTitles) {
            console.log('🔍 Trying jobTitles:', talent.jobTitles);
            if (Array.isArray(talent.jobTitles)) {
              skills = talent.jobTitles;
            } else if (typeof talent.jobTitles === 'string') {
              skills = talent.jobTitles
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s);
            }
          }

          if (skills.length === 0 && talent.jobTitle) {
            console.log('🔍 Trying jobTitle:', talent.jobTitle);
            skills = [talent.jobTitle];
          }

          // If still empty, use a default
          if (skills.length === 0) {
            console.log('⚠️ No skills found, using default');
            skills = ['General Professional'];
          }

          // Format skills array
          const formattedSkills = skills.map(
            (skill: any, skillIndex: number) => {
              let jobTitle = 'Skill';

              if (typeof skill === 'string') {
                jobTitle = skill;
              } else if (skill.name) {
                jobTitle = skill.name;
              } else if (skill.jobTitle) {
                jobTitle = skill.jobTitle;
              } else if (skill.skill) {
                jobTitle = skill.skill;
              } else if (skill.title) {
                jobTitle = skill.title;
              }

              // Clean up the job title
              jobTitle = jobTitle.trim();
              if (jobTitle === '') jobTitle = 'Skill';

              return {
                jobTitle: jobTitle,
                skillLevel: talent.skillLevel || talent.level || 'Intermediate',
                amount: this.calculateAmount(
                  talent.payRange,
                  talent.skillLevel,
                ),
                _raw: skill,
              };
            },
          );

          // console.log(`✅ Formatted ${formattedSkills.length} skills:`, formattedSkills.map(s => s.jobTitle));

          // ============ FIX: PROPERLY EXTRACT LOCATION ============
          let location = 'Remote';

          // Check multiple possible location fields in order of priority
          if (talent.address) {
            location = talent.address;
            console.log('📍 Using address:', location);
          } else if (talent.proximity) {
            location = talent.proximity;
            console.log('📍 Using proximity:', location);
          } else if (talent.location) {
            location = talent.location;
            console.log('📍 Using location:', location);
          } else if (talent.city) {
            location = talent.city;
            console.log('📍 Using city:', location);
          } else if (talent.state) {
            location = talent.state;
            console.log('📍 Using state:', location);
          } else if (talent.country) {
            location = talent.country;
            console.log('📍 Using country:', location);
          }

          // Clean up the location string
          if (typeof location === 'string') {
            location = location.trim();
            if (location === '') location = 'Remote';
          } else {
            location = 'Remote';
          }

          // ============ GET PROFILE PICTURE ============
          let profilePic = 'assets/images/default-avatar.png';
          if (talent.talentPicture) {
            profilePic = talent.talentPicture;
          } else if (talent.profilePicture) {
            profilePic = talent.profilePicture;
          } else if (talent.avatar) {
            profilePic = talent.avatar;
          } else if (talent.imageUrl) {
            profilePic = talent.imageUrl;
          } else if (talent.profileImage) {
            profilePic = talent.profileImage;
          }

          // ============ FIX PAY RANGE ============
          let payRange = talent.payRange || '₦50,000 - ₦150,000';
          payRange = this.fixNairaEncoding(payRange);

          // Ensure it has currency symbol
          if (
            !payRange.includes('₦') &&
            !payRange.includes('$') &&
            !payRange.includes('€') &&
            !payRange.includes('£')
          ) {
            payRange = `₦${payRange}`;
          }

          // ============ GET NAME ============
          let name = 'Talent';
          if (talent.fullName) {
            name = talent.fullName.trim();
          } else if (talent.name) {
            name = talent.name.trim();
          } else if (talent.firstName && talent.lastName) {
            name = `${talent.firstName} ${talent.lastName}`.trim();
          } else if (talent.username) {
            name = talent.username.trim();
          } else if (talent.email) {
            name = talent.email.split('@')[0].trim();
          }

          if (name === '') name = `Talent ${index + 1}`;

          // ============ GET EMAIL ============
          let email = 'no-email@example.com';
          if (talent.email) {
            email = talent.email.trim();
          } else if (talent.contactEmail) {
            email = talent.contactEmail.trim();
          }

          // ============ GET PHONE ============
          let phoneNumber = '';
          if (talent.phoneNumber) {
            phoneNumber = talent.phoneNumber;
          } else if (talent.phone) {
            phoneNumber = talent.phone;
          } else if (talent.contactPhone) {
            phoneNumber = talent.contactPhone;
          }

          // ============ CREATE MAPPED TALENT ============
          const mappedTalent = {
            id: talent.talentId || talent.id || `talent-${index}-${Date.now()}`,
            talentId: talent.talentId || talent.id,
            profilePic: profilePic,
            name: name,
            email: email,
            proximity: location,
            address: location, // Use the same for both for consistency
            skillSet: formattedSkills,
            payRange: payRange,
            status: this.mapStatus(
              talent.status || talent.availability || 'active',
            ),
            phoneNumber: phoneNumber,
            skillLevel: talent.skillLevel || talent.level || 'Intermediate',
            rating: talent.rating || talent.avgRating || 4.5,
            experience:
              talent.experience || talent.yearsOfExperience || '2+ years',
            _raw: talent,
          };

          console.log(`✅ Mapped talent ${index + 1}:`, {
            name: mappedTalent.name,
            address: mappedTalent.address,
            skillsCount: mappedTalent.skillSet.length,
            skills: mappedTalent.skillSet.map((s: any) => s.jobTitle),
            id: mappedTalent.id,
            payRange: mappedTalent.payRange,
          });

          return mappedTalent;
        } catch (error) {
          console.error(`❌ Error mapping talent ${index}:`, error, talent);

          // Return a minimal valid talent object to avoid breaking the UI
          return {
            id: `error-talent-${index}-${Date.now()}`,
            talentId: talent?.talentId || talent?.id || `error-${index}`,
            profilePic: 'assets/images/default-avatar.png',
            name: 'Unknown Talent',
            email: 'unknown@example.com',
            proximity: 'Remote',
            address: 'Remote',
            skillSet: [
              {
                jobTitle: 'General Professional',
                skillLevel: 'Intermediate',
                amount: 50000,
              },
            ],
            payRange: '₦50,000 - ₦150,000',
            status: 'Active',
            phoneNumber: '',
            skillLevel: 'Intermediate',
            rating: 4.0,
            experience: 'Unknown',
            _raw: talent,
          };
        }
      })
      .filter((talent) => talent !== null); // Remove any null entries
  }

  async proceedWithSelectedSkills() {
    if (this.selectedSkills.length === 0) return;

    this.loadingTalents = true;

    const subscription = this.scouterService
      .fetchAllTalents({
        skillset: this.selectedSkills,
        limit: 50,
        pageNo: 1,
      })
      .subscribe({
        next: (response) => {
          this.loadingTalents = false;
          const filtered = this.transformApiResponse(response);
          this.cdr.detectChanges();

          this.modalCtrl
            .create({
              component: ProceedToHireTalentPopupModalComponent,
              componentProps: {
                hires: filtered,
                location: this.selectedSkills.join(', '),
                allSkills: this.allSkills,
              },
              cssClass: 'all-talents-fullscreen-modal',
            })
            .then((modal) => modal.present());
        },
        error: (error) => {
          this.loadingTalents = false;
          console.error('Skills filter failed:', error);
          this.clientSideSkillsFallback();
        },
      });

    this.subscriptions.add(subscription);
  }

  private clientSideSkillsFallback() {
    const filtered = this.apiTalents.filter((t) =>
      t.skillSet?.some((s: any) =>
        this.selectedSkills.some((selected) =>
          s.jobTitle.toLowerCase().includes(selected.toLowerCase()),
        ),
      ),
    );

    this.modalCtrl
      .create({
        component: ProceedToHireTalentPopupModalComponent,
        componentProps: {
          hires: filtered,
          location: this.selectedSkills.join(', '),
          allSkills: this.allSkills,
        },
        cssClass: 'all-talents-fullscreen-modal',
      })
      .then((modal) => modal.present());
  }

  async openTalentModal(talent: any) {
    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: {
        hire: talent,
      },
      cssClass: 'all-talents-fullscreen-modal',
    });

    await modal.present();
  }

  private refreshDataForTab() {
    this.loadTalents();
  }

  private openModalWithFilteredResults(filtered: any[], location: string) {
    this.modalCtrl
      .create({
        component: FindProfessionalsByLocationModalComponent,
        componentProps: {
          hires: filtered,
          location: location || 'Unknown',
          allSkills: this.allSkills,
        },
        cssClass: 'all-talents-fullscreen-modal',
      })
      .then((modal) => modal.present());
  }

  refreshMap() {
    if (!this.map) {
      console.log('No map to refresh');
      return;
    }

    try {
      this.forceMapResize();
    } catch (error) {
      console.error('Error refreshing map:', error);
    }
  }

  clearAllSkills(): void {
    this.selectedSkills = [];
    this.filteredSkills = [...this.allSkills];
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.clearMarkers();

    if (this.mapResizeTimeout) {
      clearTimeout(this.mapResizeTimeout);
    }

    if (this.infoWindow) {
      this.infoWindow.close();
      this.infoWindow = null;
    }

    if (this.map) {
      google.maps.event.clearInstanceListeners(this.map);
      this.map = null;
      this.mapInitialized = false;
    }
  }
}
