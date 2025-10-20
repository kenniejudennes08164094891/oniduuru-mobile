import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateRecordPage } from './create-record.page';

describe('CreateRecordPage', () => {
  let component: CreateRecordPage;
  let fixture: ComponentFixture<CreateRecordPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRecordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
