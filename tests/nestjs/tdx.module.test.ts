import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { TdxClient, type TdxClientOptions } from 'tdx-taiwan';
import { TDX_OPTIONS, TdxModule } from 'tdx-taiwan/nestjs';
import { jsonResponse, tokenResponse } from '../helpers.js';

const fetch = vi.fn((url: string) =>
  Promise.resolve(
    url.includes('/openid-connect/token') ? tokenResponse('nest-token') : jsonResponse([]),
  ),
);

// Stands in for @nestjs/config's ConfigService.
const CONFIG = 'CONFIG';
@Module({
  providers: [{ provide: CONFIG, useValue: { id: 'cfg-id', secret: 'cfg-secret' } }],
  exports: [CONFIG],
})
class FakeConfigModule {}

@Injectable()
class BikeService {
  constructor(@Inject(TdxClient) readonly tdx: TdxClient) {}
}

describe('TdxModule.forRoot', () => {
  it('provides a TdxClient singleton and its options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret', fetch })],
    }).compile();

    const client = moduleRef.get(TdxClient);
    expect(client).toBeInstanceOf(TdxClient);
    expect(moduleRef.get(TdxClient)).toBe(client);
    expect(moduleRef.get<TdxClientOptions>(TDX_OPTIONS)).toMatchObject({
      clientId: 'id',
      clientSecret: 'secret',
    });
    await expect(client.getAccessToken()).resolves.toBe('nest-token');
  });

  it('does not pass isGlobal through to the client options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret', isGlobal: true })],
    }).compile();

    expect(moduleRef.get(TDX_OPTIONS)).not.toHaveProperty('isGlobal');
  });

  it('injects TdxClient into consumers by class', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret' })],
      providers: [BikeService],
    }).compile();

    expect(moduleRef.get(BikeService).tdx).toBe(moduleRef.get(TdxClient));
  });

  it('is visible to other modules without importing it when isGlobal is set', async () => {
    @Module({ providers: [BikeService], exports: [BikeService] })
    class FeatureModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret', isGlobal: true }),
        FeatureModule,
      ],
    }).compile();

    expect(moduleRef.get(BikeService).tdx).toBeInstanceOf(TdxClient);
  });

  it('fails fast on missing credentials', async () => {
    await expect(
      Test.createTestingModule({
        imports: [TdxModule.forRoot({ clientId: '', clientSecret: '' })],
      }).compile(),
    ).rejects.toThrow(/clientId and clientSecret/);
  });
});

describe('TdxModule.forRootAsync', () => {
  it('builds options with an injected (config) provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TdxModule.forRootAsync({
          imports: [FakeConfigModule],
          inject: [CONFIG],
          useFactory: (config: { id: string; secret: string }) => ({
            clientId: config.id,
            clientSecret: config.secret,
            fetch,
          }),
        }),
      ],
    }).compile();

    expect(moduleRef.get<TdxClientOptions>(TDX_OPTIONS)).toMatchObject({
      clientId: 'cfg-id',
      clientSecret: 'cfg-secret',
    });
    await expect(moduleRef.get(TdxClient).getAccessToken()).resolves.toBe('nest-token');
  });

  it('supports async factories and isGlobal', async () => {
    @Module({ providers: [BikeService], exports: [BikeService] })
    class FeatureModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TdxModule.forRootAsync({
          isGlobal: true,
          useFactory: () => Promise.resolve({ clientId: 'async-id', clientSecret: 'async-secret' }),
        }),
        FeatureModule,
      ],
    }).compile();

    expect(moduleRef.get(BikeService).tdx).toBeInstanceOf(TdxClient);
  });
});

describe('core package', () => {
  it('never imports @nestjs outside src/nestjs', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'nestjs') walk(path);
        } else if (/@nestjs\//.test(readFileSync(path, 'utf8'))) {
          offenders.push(path);
        }
      }
    };
    walk(new URL('../../src', import.meta.url).pathname);

    expect(offenders).toEqual([]);
  });
});
