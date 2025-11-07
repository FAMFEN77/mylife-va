import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { createReadStream } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Readable } from 'node:stream';

import { SaveResult, StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly rootDir: string;

  constructor() {
    super();
    this.rootDir = path.resolve(process.cwd(), 'uploads', 'documents');
  }

  async save(file: Express.Multer.File): Promise<SaveResult> {
    try {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const directory = path.join(this.rootDir, year, month);
      await fs.mkdir(directory, { recursive: true });

      const filename = `${randomUUID()}.pdf`;
      const absolutePath = path.join(directory, filename);
      await fs.writeFile(absolutePath, file.buffer);

      const relativePath = path.relative(this.rootDir, absolutePath).replace(/\\/g, '/');

      return {
        path: relativePath,
        mime: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      };
    } catch (error) {
      throw new InternalServerErrorException('Opslaan van document is mislukt.');
    }
  }

  async stream(filePath: string): Promise<Readable> {
    const absolutePath = this.resolvePath(filePath);
    try {
      await fs.access(absolutePath);
      return createReadStream(absolutePath);
    } catch {
      throw new NotFoundException('Bestand niet gevonden.');
    }
  }

  async delete(filePath: string): Promise<void> {
    const absolutePath = this.resolvePath(filePath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // Bestaat mogelijk niet meer – negeren.
    }
  }

  private resolvePath(relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.rootDir, normalized);
  }
}
