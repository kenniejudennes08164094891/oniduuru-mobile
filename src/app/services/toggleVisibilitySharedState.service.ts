// toggle-visibility-shared-state.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class ToggleVisibilitySharedStateService {
  private storageReady = false;
  private readonly STORAGE_KEY = 'balanceVisibilityState';

  constructor(private storage: Storage) {
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Create the storage instance
      await this.storage.create();
      this.storageReady = true;
      console.log('✅ Ionic Storage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Ionic Storage:', error);
      // Fallback to localStorage
    }
  }

  private async ensureStorageReady(): Promise<boolean> {
    if (!this.storageReady) {
      try {
        await this.initializeStorage();
      } catch (error) {
        console.error('Storage initialization failed:', error);
        return false;
      }
    }
    return this.storageReady;
  }

  async getBalanceVisibility(): Promise<boolean> {
    try {
      const isReady = await this.ensureStorageReady();
      
      if (isReady) {
        const value = await this.storage.get(this.STORAGE_KEY);
        console.log('🔍 Retrieved from Ionic Storage:', value);
        return value !== null ? value : false;
      } else {
        // Fallback to localStorage
        return this.getFromLocalStorage();
      }
    } catch (error) {
      console.error('Error getting balance visibility:', error);
      return this.getFromLocalStorage();
    }
  }

  async setBalanceVisibility(isHidden: boolean): Promise<void> {
    try {
      const isReady = await this.ensureStorageReady();
      
      if (isReady) {
        await this.storage.set(this.STORAGE_KEY, isHidden);
        console.log('💾 Saved to Ionic Storage:', isHidden);
      }
      
      // Always save to localStorage as backup
      this.saveToLocalStorage(isHidden);
    } catch (error) {
      console.error('Error saving balance visibility:', error);
      this.saveToLocalStorage(isHidden);
    }
  }

  private getFromLocalStorage(): boolean {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      console.log('🔍 Fallback: Loaded from localStorage:', savedState);
      return savedState !== null ? JSON.parse(savedState) : false;
    } catch (error) {
      console.error('Fallback localStorage read error:', error);
      return false;
    }
  }

  private saveToLocalStorage(isHidden: boolean): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(isHidden));
      console.log('💾 Fallback: Saved to localStorage:', isHidden);
    } catch (error) {
      console.error('Fallback localStorage save error:', error);
    }
  }

  async toggleBalanceVisibility(currentState: boolean): Promise<boolean> {
    const newState = !currentState;
    await this.setBalanceVisibility(newState);
    return newState;
  }
}