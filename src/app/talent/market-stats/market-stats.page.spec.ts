import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketStatsPage } from './market-stats.page';

describe('MarketStatsPage', () => {
  let component: MarketStatsPage;
  let fixture: ComponentFixture<MarketStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
