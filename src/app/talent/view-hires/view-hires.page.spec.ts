import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewHiresPage } from './view-hires.page';

describe('ViewHiresPage', () => {
  let component: ViewHiresPage;
  let fixture: ComponentFixture<ViewHiresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewHiresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
