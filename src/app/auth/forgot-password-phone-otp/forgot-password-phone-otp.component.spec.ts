import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ForgotPasswordPhoneOtpComponent } from './forgot-password-phone-otp.component';

describe('ForgotPasswordPhoneOtpComponent', () => {
  let component: ForgotPasswordPhoneOtpComponent;
  let fixture: ComponentFixture<ForgotPasswordPhoneOtpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ForgotPasswordPhoneOtpComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPhoneOtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
