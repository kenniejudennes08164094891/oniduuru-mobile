import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { ModalController, Platform } from '@ionic/angular';
import { FindProfessionalsByLocationModalComponent } from 'src/app/utilities/modals/find-professionals-by-location-modal/find-professionals-by-location-modal.component';
import { Router } from '@angular/router';
import { ProceedToHireTalentPopupModalComponent } from 'src/app/utilities/modals/proceed-to-hire-talent-popup-modal/proceed-to-hire-talent-popup-modal.component';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { Subscription } from 'rxjs';
import { ViewAllTalentsPopupModalComponent } from 'src/app/utilities/modals/view-all-talents-popup-modal/view-all-talents-popup-modal.component';

@Component({
  selector: 'app-view-talents-location-page',
  templateUrl: './view-talents-location-page.component.html',
  styleUrls: ['./view-talents-location-page.component.scss'],
  standalone: false,
})
export class ViewTalentsLocationPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private isMapInitializing = false;
  private mapInitialized = false;
  private mapResizeTimeout: any;

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
  scouterName: string = ''; // Initialize as empty string
  scouterProfilePic: string = ''; // Add profile picture property
  currentLocation: string = 'Lagos';
  activeTab: 'location' | 'skill' = 'location';
  showSkillSetTab = false;

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
    private cdr: ChangeDetectorRef
  ) { }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', reject);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDwlkVSi56mNcDtPasXHj-viQIGs2DIN0c&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async ngOnInit() {
    try {
      this.loadUserFromLocalStorage(); // Load user data first
      await this.fetchScouterProfile(); // Then try to fetch from API
      await this.loadGoogleMapsScript();
      await this.loadTalents();
      this.loadSkills();
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.loadingTalents = false;
      this.loadingSkills = false;
    }
  }

  ngAfterViewInit(): void {
    // Initialize map on first load
    if (this.activeTab === 'location') {
      setTimeout(() => this.initializeMapWithTalents(), 100);
    }
  }

  private loadUserFromLocalStorage() {
    try {
      // Try to get user data from localStorage
      let userData = null;
      
      // Check for user_profile_data first
      const userProfileData = localStorage.getItem('user_profile_data');
      if (userProfileData) {
        userData = JSON.parse(userProfileData);
        console.log('Found user data in user_profile_data:', userData);
      } 
      // If not found, check for user_data
      else {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
          console.log('Found user data in user_data:', userData);
        }
      }
      
      // If user data is found, extract the name
      if (userData) {
        // Check different possible property names for the user's name
        if (userData.fullName) {
          this.scouterName = userData.fullName;
        } else if (userData.name) {
          this.scouterName = userData.name;
        } else if (userData.firstName && userData.lastName) {
          this.scouterName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.username) {
          this.scouterName = userData.username;
        } else if (userData.email) {
          this.scouterName = userData.email.split('@')[0]; // Use email username as fallback
        }
        
        // Extract profile picture if available
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
        this.scouterName = 'Scouter'; // Default fallback
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      this.scouterName = 'Scouter'; // Default fallback
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
                // Only update if we don't already have a name from localStorage
                if (!this.scouterName || this.scouterName === 'Scouter') {
                  this.scouterName = response.details.fullName;
                  this.cdr.detectChanges();
                }
              }
              
              // Update profile picture from API if available
              if (response.details?.profilePicture) {
                this.scouterProfilePic = response.details.profilePicture;
                this.cdr.detectChanges();
              }
            },
            error: (error) => {
              console.warn('Could not fetch scouter profile:', error);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not parse token:', error);
    }
  }

  // Rest of your existing methods remain the same...
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

      // Check if map already exists but container was recreated
      if (this.map && this.mapInitialized) {
        console.log('Map exists, checking if container is valid');
        try {
          // Try to trigger resize first
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
            stylers: [{ visibility: 'off' }]
          }
        ],
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      this.geocoder = new google.maps.Geocoder();
      this.infoWindow = new google.maps.InfoWindow();
      this.mapInitialized = true;

      // Initialize map with markers
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
    
    // Clear any existing timeout
    if (this.mapResizeTimeout) {
      clearTimeout(this.mapResizeTimeout);
    }
    
    // Multiple resize triggers with delays to ensure map renders properly
    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 50);
    
    this.mapResizeTimeout = setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
        // Re-center the map after resize
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
      this.loadTalents();
      return;
    }

    this.loadingTalents = true;

    const subscription = this.scouterService.fetchAllTalents({
      location: query,
      limit: 50,
      pageNo: 1
    }).subscribe({
      next: (response) => {
        this.loadingTalents = false;
        const filtered = this.transformApiResponse(response);
        this.apiTalents = filtered;

        // Switch to location tab if not already there
        if (this.activeTab !== 'location') {
          this.openLocationTab();
        } else {
          // Update map markers
          this.addTalentMarkers(filtered);
        }

        this.currentLocation = query || 'Search Results';
        this.cdr.detectChanges();

        this.openModalWithFilteredResults(filtered, this.currentLocation);
      },
      error: (error) => {
        this.loadingTalents = false;
        console.error('Search failed:', error);
        this.clientSideSearchFallback(query);
      }
    });

    this.subscriptions.add(subscription);
  }

  private clientSideSearchFallback(query: string) {
    const filtered = this.apiTalents.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(query);
      const skillMatch = t.skillSet?.some((s: any) =>
        s.jobTitle.toLowerCase().includes(query)
      );
      const locationMatch = t.proximity?.toLowerCase().includes(query);
      return nameMatch || skillMatch || locationMatch;
    });

    // Switch to location tab if not already there
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
    this.clearMarkers();

    if (!this.map || talents.length === 0) {
      return;
    }

    talents.forEach((talent, index) => {
      const address = talent.address || talent.proximity || 'Lagos, Nigeria';

      this.geocodeAddress(address).then((location) => {
        if (location) {
          this.createTalentMarker(talent, location, index);
        }
      }).catch((error) => {
        const defaultLocation = {
          lat: 6.5244 + (Math.random() * 0.1 - 0.05),
          lng: 3.3792 + (Math.random() * 0.1 - 0.05)
        };
        this.createTalentMarker(talent, defaultLocation, index);
      });
    });
  }

  private createTalentMarker(talent: any, location: any, index: number) {
    if (!this.map || !google.maps) return;

    try {
      const marker = new google.maps.Marker({
        position: location,
        map: this.map,
        title: talent.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FF6B6B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        }
      });

      marker.addListener('click', () => {
        this.showTalentInfo(talent, marker);
      });

      this.markers.push(marker);

      if (this.markers.length === 1) {
        this.map.setCenter(location);
        this.map.setZoom(12);
      } else if (this.markers.length > 1) {
        this.fitMapBounds();
      }
    } catch (error) {
      console.error('Error creating talent marker:', error);
    }
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
          <button id="view-profile-${talent.id}"
                  class="mt-2 w-full bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 transition">
            View Profile
          </button>
        </div>
      </div>
    `;

      this.infoWindow.setContent(content);
      this.infoWindow.open(this.map, marker);

      setTimeout(() => {
        const button = document.getElementById(`view-profile-${talent.id}`);
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

  private geocodeAddress(address: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        this.geocoder = new google.maps.Geocoder();
      }

      this.geocoder.geocode({ address: address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].geometry.location);
        } else {
          reject(status);
        }
      });
    });
  }

  private fitMapBounds() {
    if (this.markers.length === 0 || !this.map || !google.maps) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      this.markers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });

      this.map.fitBounds(bounds);

      if (this.markers.length === 1) {
        google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
          if (this.map.getZoom() > 15) {
            this.map.setZoom(15);
          }
        });
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
    }
  }

  private clearMarkers() {
    this.markers.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (error) {
        console.error('Error clearing marker:', error);
      }
    });
    this.markers = [];
  }

  // ============ DATA LOADING ============

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
        this.allSkills = ['Web Development', 'Design', 'Marketing', 'Writing', 'Consulting'];
        this.filteredSkills = [...this.allSkills];
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(subscription);
  }

  private loadTalents() {
    this.loadingTalents = true;

    const params: any = {
      limit: 50,
      pageNo: 1
    };

    if (this.activeTab === 'location' && this.currentLocation) {
      params.location = this.currentLocation;
    }

    if (this.activeTab === 'skill' && this.selectedSkills.length > 0) {
      params.skillset = this.selectedSkills;
    }

    const subscription = this.scouterService.fetchAllTalents(params).subscribe({
      next: (response) => {
        this.loadingTalents = false;
        this.apiTalents = this.transformApiResponse(response);
        this.cdr.detectChanges();

        if (this.activeTab === 'location') {
          this.initializeMapWithTalents();
        }
      },
      error: (error) => {
        this.loadingTalents = false;
        console.error('Failed to load talents:', error);
        this.apiTalents = [];
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(subscription);
  }

  initializeMapWithTalents() {
    if (this.activeTab !== 'location' || this.isMapInitializing) {
      return;
    }

    this.isMapInitializing = true;

    // Small delay to ensure DOM is ready
    setTimeout(async () => {
      try {
        await this.initGoogleMap();
        
        // Add markers after map is initialized
        if (this.map && this.apiTalents.length > 0) {
          this.addTalentMarkers(this.apiTalents);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      } finally {
        this.isMapInitializing = false;
      }
    }, 100);
  }

  private mapTalentsToFormat(talents: any[]): any[] {
    if (!talents || !Array.isArray(talents)) {
      return [];
    }

    return talents.map((talent: any, index: number) => {
      let skills = [];
      try {
        if (talent.skillSets && typeof talent.skillSets === 'string') {
          skills = JSON.parse(talent.skillSets);
        } else if (talent.skillSets && Array.isArray(talent.skillSets)) {
          skills = talent.skillSets;
        }
      } catch (e) {
        console.error('Failed to parse skillsets:', e, talent.skillSets);
        skills = [];
      }

      let profilePic = 'assets/images/default-avatar.png';
      if (talent.talentPicture) {
        profilePic = talent.talentPicture;
      }

      let payRange = talent.payRange || '₦50,000 - ₦150,000';
      payRange = this.fixNairaEncoding(payRange);

      const mappedTalent = {
        id: talent.id || talent.talentId || `talent-${index}`,
        profilePic: profilePic,
        name: talent.fullName?.trim() || `Talent ${index + 1}`,
        email: talent.email || 'no-email@example.com',
        proximity: talent.address || 'Remote',
        skillSet: skills.map((skill: any) => {
          let jobTitle = 'Skill';
          if (typeof skill === 'string') {
            jobTitle = skill;
          } else if (skill.name) {
            jobTitle = skill.name;
          } else if (skill.jobTitle) {
            jobTitle = skill.jobTitle;
          } else if (skill.skill) {
            jobTitle = skill.skill;
          }

          return {
            jobTitle: jobTitle,
            skillLevel: talent.skillLevel || 'Intermediate',
            amount: this.calculateAmount(talent.payRange, talent.skillLevel)
          };
        }),
        payRange: payRange,
        status: this.mapStatus(talent.status),
        phoneNumber: talent.phoneNumber,
        address: talent.address,
        skillLevel: talent.skillLevel,
        _raw: talent
      };

      return mappedTalent;
    });
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
    return this.fixNairaEncoding(payRange.includes('₦') ? payRange : `₦${payRange}`);
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
      'Beginner': 30000,
      'Intermediate': 50000,
      'Expert': 80000,
      'Mid-level-Experienced': 60000
    };

    return multipliers[skillLevel] || 50000;
  }

  private mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'inactive': 'Away',
      'pending': 'Pending',
      'available': 'Active'
    };
    return statusMap[status?.toLowerCase()] || 'Active';
  }

  // ============ TAB MANAGEMENT ============

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.filteredSkills = this.allSkills.filter(
      (skill) => !this.selectedSkills.includes(skill)
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
      skill.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get dropdownSkills(): string[] {
    const selectedNotInFiltered = this.selectedSkills.filter(
      (s) => !this.filteredSkills.includes(s)
    );
    return [...this.filteredSkills, ...selectedNotInFiltered];
  }

  removeSkill(skill: string) {
    this.selectedSkills = this.selectedSkills.filter((s) => s !== skill);
    this.filteredSkills = this.allSkills.filter(
      (s) => !this.selectedSkills.includes(s)
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
    
    // Force change detection first
    this.cdr.detectChanges();
    
    // Then reinitialize map after DOM update
    setTimeout(() => {
      this.initializeMapWithTalents();
    }, 300); // Increased delay to ensure DOM is ready
  }

  async openFindProfessionalsByLocationModal() {
    if (this.activeTab !== 'location') {
      this.openLocationTab();
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    this.loadingTalents = true;

    const subscription = this.scouterService.fetchAllTalents({
      location: this.currentLocation,
      limit: 100,
      pageNo: 1
    }).subscribe({
      next: (response) => {
        this.loadingTalents = false;

        let hires = [];
        if (response.decodedData && response.decodedData.mappedTalents) {
          hires = this.transformApiResponse(response);
        } else if (response.data && typeof response.data === 'string') {
          hires = this.decodeAndTransformResponse(response);
        } else if (response.talents) {
          hires = this.mapTalentsToFormat(response.talents);
        }

        this.modalCtrl.create({
          component: FindProfessionalsByLocationModalComponent,
          componentProps: {
            hires: hires,
            location: this.currentLocation || 'Unknown',
            allSkills: this.allSkills
          },
          cssClass: 'all-talents-fullscreen-modal',
        }).then(modal => {
          modal.present();
          modal.onDidDismiss().then(() => {
            this.refreshMap();
          });
        });
      },
      error: (error) => {
        this.loadingTalents = false;
        console.error('Failed to load location hires:', error);
      }
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

  private transformApiResponse(apiResponse: any): any[] {
    if (!apiResponse) return [];

    if (apiResponse.decodedData) {
      if (apiResponse.decodedData.mappedTalents) {
        return this.mapTalentsToFormat(apiResponse.decodedData.mappedTalents);
      }
      if (apiResponse.decodedData.talents) {
        return this.mapTalentsToFormat(apiResponse.decodedData.talents);
      }
    }

    if (apiResponse.talents) {
      return this.mapTalentsToFormat(apiResponse.talents);
    }

    if (apiResponse.data && typeof apiResponse.data === 'string') {
      try {
        const decodedString = atob(apiResponse.data);
        const decodedData = JSON.parse(decodedString);

        if (decodedData.mappedTalents) {
          return this.mapTalentsToFormat(decodedData.mappedTalents);
        } else if (decodedData.talents) {
          return this.mapTalentsToFormat(decodedData.talents);
        }
      } catch (error) {
        console.error('Failed to decode response.data:', error);
      }
    }

    return [];
  }

  async proceedWithSelectedSkills() {
    if (this.selectedSkills.length === 0) return;

    this.loadingTalents = true;

    const subscription = this.scouterService.fetchAllTalents({
      skillset: this.selectedSkills,
      limit: 50,
      pageNo: 1
    }).subscribe({
      next: (response) => {
        this.loadingTalents = false;
        const filtered = this.transformApiResponse(response);
        this.cdr.detectChanges();

        this.modalCtrl.create({
          component: ProceedToHireTalentPopupModalComponent,
          componentProps: {
            hires: filtered,
            location: this.selectedSkills.join(', '),
            allSkills: this.allSkills
          },
          cssClass: 'all-talents-fullscreen-modal',
        }).then(modal => modal.present());
      },
      error: (error) => {
        this.loadingTalents = false;
        console.error('Skills filter failed:', error);
        this.clientSideSkillsFallback();
      }
    });

    this.subscriptions.add(subscription);
  }

  private clientSideSkillsFallback() {
    const filtered = this.apiTalents.filter((t) =>
      t.skillSet?.some((s: any) =>
        this.selectedSkills.some(
          (selected) => s.jobTitle.toLowerCase().includes(selected.toLowerCase())
        )
      )
    );

    this.modalCtrl.create({
      component: ProceedToHireTalentPopupModalComponent,
      componentProps: {
        hires: filtered,
        location: this.selectedSkills.join(', '),
        allSkills: this.allSkills
      },
      cssClass: 'all-talents-fullscreen-modal',
    }).then(modal => modal.present());
  }

  async openTalentModal(talent: any) {
    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: {
        hire: talent
      },
      cssClass: 'all-talents-fullscreen-modal',
    });

    await modal.present();
  }

  private refreshDataForTab() {
    this.loadTalents();
  }

  private openModalWithFilteredResults(filtered: any[], location: string) {
    this.modalCtrl.create({
      component: FindProfessionalsByLocationModalComponent,
      componentProps: {
        hires: filtered,
        location: location || 'Unknown',
        allSkills: this.allSkills
      },
      cssClass: 'all-talents-fullscreen-modal',
    }).then(modal => modal.present());
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