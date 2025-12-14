// src/app/scouter/pages/network-test/network-test.component.ts
import { Component, NgModule } from '@angular/core';
import { CommonModule, JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-network-test',
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Network Test Page</h1>
      
      <div class="space-y-4">
        <div>
          <ion-button 
            (click)="testBasicRequest()"
            color="primary"
            class="w-full"
          >
            Test Basic HTTP Request
          </ion-button>
          <pre class="mt-2 bg-gray-100 p-2 rounded" *ngIf="results.basic">{{ results.basic | json }}</pre>
        </div>
        
        <div>
          <ion-button 
            (click)="testBackendRequest()"
            color="success"
            class="w-full"
          >
            Test Backend Connection
          </ion-button>
          <pre class="mt-2 bg-gray-100 p-2 rounded" *ngIf="results.backend">{{ results.backend | json }}</pre>
        </div>
        
        <div>
          <ion-button 
            (click)="testLocalStorage()"
            color="tertiary"
            class="w-full"
          >
            Test LocalStorage
          </ion-button>
          <pre class="mt-2 bg-gray-100 p-2 rounded" *ngIf="results.storage">{{ results.storage | json }}</pre>
        </div>
        
        <div class="mt-6">
          <h3 class="text-lg font-semibold mb-2">Network Logs:</h3>
          <div class="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-auto">
            <div *ngFor="let log of logs">{{ log }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: false, // Make sure this is false if you're using modules
})
export class NetworkTestComponent {
  results: any = {};
  logs: string[] = [];
  
  constructor(private http: HttpClient) {}
  
  private log(message: string): void {
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    this.logs.unshift(`[${time}] ${message}`);
    if (this.logs.length > 20) this.logs.pop();
  }
  
  testBasicRequest(): void {
    this.log('Testing basic HTTP request...');
    
    this.http.get('https://httpbin.org/get').subscribe({
      next: (res) => {
        this.log('✅ Basic request successful');
        this.results.basic = { success: true, data: 'Connected to internet' };
      },
      error: (err) => {
        this.log('❌ Basic request failed: ' + err.message);
        this.results.basic = { success: false, error: err.message };
      }
    });
  }
  
  testBackendRequest(): void {
    this.log('Testing backend connection...');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.log('❌ No access token found');
      this.results.backend = { error: 'No access token' };
      return;
    }
    
    const url = `${environment.baseUrl}/health`;
    this.log(`Connecting to: ${url}`);
    
    this.http.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (res) => {
        this.log('✅ Backend connection successful');
        this.results.backend = { success: true, data: res };
      },
      error: (err) => {
        this.log(`❌ Backend connection failed: ${err.status} ${err.message}`);
        this.results.backend = { 
          success: false, 
          status: err.status,
          error: err.message 
        };
      }
    });
  }
  
  testLocalStorage(): void {
    this.log('Testing localStorage...');
    
    const items: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          items[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          items[key] = localStorage.getItem(key);
        }
      }
    }
    
    this.log(`Found ${Object.keys(items).length} items in localStorage`);
    this.results.storage = items;
  }
}

// If this is a standalone component, add this NgModule
@NgModule({
  imports: [CommonModule, IonicModule],
  declarations: [NetworkTestComponent],
  exports: [NetworkTestComponent],
})
export class NetworkTestModule {}