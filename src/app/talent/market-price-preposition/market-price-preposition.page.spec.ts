import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketPricePrepositionPage } from './market-price-preposition.page';

describe('MarketPricePrepositionPage', () => {
  let component: MarketPricePrepositionPage;
  let fixture: ComponentFixture<MarketPricePrepositionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketPricePrepositionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
