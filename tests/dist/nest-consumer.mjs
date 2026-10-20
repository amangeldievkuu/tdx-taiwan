// Runs in a plain Node process against the built package (dist/), resolved through
// package.json "exports". Plain JavaScript has no decorator metadata at all, so this proves
// the bundled TdxModule works with explicit @Inject / useFactory only.
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TdxClient } from 'tdx-taiwan';
import { TDX_OPTIONS, TdxModule } from 'tdx-taiwan/nestjs';

class BikeService {
  constructor(tdx) {
    this.tdx = tdx;
  }
}
Inject(TdxClient)(BikeService, undefined, 0);
Injectable()(BikeService);

class ConfigModule {}
Module({
  providers: [{ provide: 'CONFIG', useValue: { id: 'cfg-id', secret: 'cfg-secret' } }],
  exports: ['CONFIG'],
})(ConfigModule);

const sync = await Test.createTestingModule({
  imports: [TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret' })],
  providers: [BikeService],
}).compile();

const async = await Test.createTestingModule({
  imports: [
    TdxModule.forRootAsync({
      imports: [ConfigModule],
      inject: ['CONFIG'],
      useFactory: (config) => ({ clientId: config.id, clientSecret: config.secret }),
    }),
  ],
  providers: [BikeService],
}).compile();

console.log(
  JSON.stringify({
    resolved: import.meta.resolve('tdx-taiwan/nestjs'),
    forRoot: sync.get(TdxClient) instanceof TdxClient,
    injected: sync.get(BikeService).tdx === sync.get(TdxClient),
    forRootAsync: async.get(BikeService).tdx instanceof TdxClient,
    asyncOptions: async.get(TDX_OPTIONS),
  }),
);
