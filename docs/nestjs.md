# NestJS (`tdx-taiwan/nestjs`)

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TdxModule } from 'tdx-taiwan/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TdxModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        clientId: config.getOrThrow('TDX_CLIENT_ID'),
        clientSecret: config.getOrThrow('TDX_CLIENT_SECRET'),
        cache: true,
      }),
    }),
  ],
})
export class AppModule {}
```

```ts
// bus.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { TdxClient } from 'tdx-taiwan';

@Injectable()
export class BusService {
  // Explicit @Inject works even when your build does not emit decorator metadata
  // (esbuild, SWC without metadata, Vitest).
  constructor(@Inject(TdxClient) private readonly tdx: TdxClient) {}

  arrivals(route: string) {
    return this.tdx.bus.eta('Taipei', route);
  }
}
```

`TdxModule.forRoot({ clientId, clientSecret, isGlobal })` is also available for static
configuration. `@nestjs/common` (v10–v12) is an optional peer dependency — the core package
never loads it.
