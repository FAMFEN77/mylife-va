import type { Readable } from 'node:stream';
import type { Express } from 'express';

export interface SaveResult {
  path: string;
  mime: string;
  size: number;
  originalName: string;
}

export abstract class StorageService {
  abstract save(file: Express.Multer.File): Promise<SaveResult>;
  abstract stream(path: string): Promise<Readable>;
  abstract delete(path: string): Promise<void>;
}
