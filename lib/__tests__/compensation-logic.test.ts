import { describe, it, expect } from 'vitest';
import { calculateCompensation } from '../compensation-logic';

describe('Compensation Logic - Production Readiness Audit', () => {
  
  describe('EU_ECAA (EC 261/2004) Jurisdikcija', () => {
    it('kratki letovi (<=1500km) - donose 250 EUR ako je kasnjenje >= 3h', () => {
      const result = calculateCompensation(1500, 3, 'EU_ECAA');
      expect(result.amount).toBe(250);
      expect(result.currency).toBe('EUR');
    });

    it('srednji letovi (1500km-3500km) - donose 400 EUR ako je kasnjenje >= 3h', () => {
      const result = calculateCompensation(2500, 3.5, 'EU_ECAA');
      expect(result.amount).toBe(400);
      expect(result.currency).toBe('EUR');
    });

    it('dugi letovi (>3500km van EU) - donose punih 600 EUR ako je kasnjenje >= 4h', () => {
      const result = calculateCompensation(4500, 4, 'EU_ECAA');
      expect(result.amount).toBe(600);
      expect(result.currency).toBe('EUR');
    });

    it('vraca 0 ako je kasnjenje ispod zakonskog praga od 3h', () => {
      const result = calculateCompensation(5000, 2.5, 'EU_ECAA');
      expect(result.amount).toBe(0);
    });
  });

  describe('UK Jurisdikcija (UK261)', () => {
    it('pravilno racuna UK funte na osnovu distance i praga od 3h', () => {
      const shortUK = calculateCompensation(1000, 3, 'UK');
      expect(shortUK.amount).toBe(220);
      expect(shortUK.currency).toBe('GBP');

      const longUK = calculateCompensation(4000, 4, 'UK');
      expect(longUK.amount).toBe(520);
      expect(longUK.currency).toBe('GBP');
    });
  });

  describe('USA Jurisdikcija (US DOT Mandates)', () => {
    it('međunarodni letovi - aktiviraju pravo na refund ako je kašnjenje >= 6h', () => {
      // US DOT gleda sate, ne distancu za međunarodne letove
      const result = calculateCompensation(6000, 6.5, 'USA');
      expect(result.amount).toBe(100);
      expect(result.currency).toBe('% REFUND');
    });

    it('vraca 0 za USA ako je znacajno kasnjenje ispod 6h za medjunarodne letove', () => {
      const result = calculateCompensation(6000, 5, 'USA');
      expect(result.amount).toBe(0);
    });
  });
});
