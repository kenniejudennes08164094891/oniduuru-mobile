import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConcludeYourHiringProcessPageComponent } from './conclude-your-hiring-process-page.component';

describe('ConcludeYourHiringProcessPageComponent', () => {
  let component: ConcludeYourHiringProcessPageComponent;
  let fixture: ComponentFixture<ConcludeYourHiringProcessPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConcludeYourHiringProcessPageComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConcludeYourHiringProcessPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
