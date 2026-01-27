// shared-talent-data.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedTalentDataService {
  private talentsSource = new BehaviorSubject<any[]>([]);
  currentTalents = this.talentsSource.asObservable();
  
  private locationSource = new BehaviorSubject<string>('Lagos');
  currentLocation = this.locationSource.asObservable();
  
  updateTalents(talents: any[]) {
    this.talentsSource.next(talents);
  }
  
  updateLocation(location: string) {
    this.locationSource.next(location);
  }
  
  clearData() {
    this.talentsSource.next([]);
    this.locationSource.next('Lagos');
  }
}