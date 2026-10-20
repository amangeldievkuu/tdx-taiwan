// CommonJS twin of nest-consumer.mjs: loads dist/*.cjs through package.json "exports".
const { Inject, Injectable } = require('@nestjs/common');
const { Test } = require('@nestjs/testing');
const { TdxClient } = require('tdx-taiwan');
const { TdxModule } = require('tdx-taiwan/nestjs');

class BikeService {
  constructor(tdx) {
    this.tdx = tdx;
  }
}
Inject(TdxClient)(BikeService, undefined, 0);
Injectable()(BikeService);

async function main() {
  const moduleRef = await Test.createTestingModule({
    imports: [TdxModule.forRoot({ clientId: 'id', clientSecret: 'secret' })],
    providers: [BikeService],
  }).compile();

  console.log(
    JSON.stringify({
      resolved: require.resolve('tdx-taiwan/nestjs'),
      forRoot: moduleRef.get(TdxClient) instanceof TdxClient,
      injected: moduleRef.get(BikeService).tdx === moduleRef.get(TdxClient),
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
