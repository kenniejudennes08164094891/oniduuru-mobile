import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilitiesPage } from './utilities.page';

describe('UtilitiesPage', () => {
  let component: UtilitiesPage;
  let fixture: ComponentFixture<UtilitiesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UtilitiesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
