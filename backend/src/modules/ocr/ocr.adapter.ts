import { Injectable } from '@nestjs/common';

export type OcrReceipt = {
  amount?: number;
  currency?: string;
  date?: string;
  vatRate?: string;
  category?: string;
  confidence?: number;
};

@Injectable()
export class OcrAdapter {
  async extract(_file: Buffer, _mime: string): Promise<OcrReceipt> {
    // Placeholder payload for demo purposes
    return {
      amount: 42.5,
      currency: 'EUR',
      date: new Date().toISOString().slice(0, 10),
      vatRate: '21%',
      category: 'Materials',
      confidence: 0.92,
    };
  }
}
