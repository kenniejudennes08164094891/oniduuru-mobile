import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ForgotPasswordVerifyOtpComponent } from './forgot-password-verify-otp.component';

describe('ForgotPasswordVerifyOtpComponent', () => {
  let component: ForgotPasswordVerifyOtpComponent;
  let fixture: ComponentFixture<ForgotPasswordVerifyOtpComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ForgotPasswordVerifyOtpComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordVerifyOtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
