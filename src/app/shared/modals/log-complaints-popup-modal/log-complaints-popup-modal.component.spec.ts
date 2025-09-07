import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LogComplaintsPopupModalComponent } from './log-complaints-popup-modal.component';

describe('LogComplaintsPopupModalComponent', () => {
  let component: LogComplaintsPopupModalComponent;
  let fixture: ComponentFixture<LogComplaintsPopupModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LogComplaintsPopupModalComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LogComplaintsPopupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
