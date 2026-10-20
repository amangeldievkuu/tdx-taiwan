import {
  type DynamicModule,
  type FactoryProvider,
  type InjectionToken,
  Module,
  type ModuleMetadata,
  type OptionalFactoryDependency,
} from '@nestjs/common';
// Imported by package name (kept external by tsup) so this entry shares the core's
// TdxClient class instead of bundling a second copy, which would break injection by class.
import { TdxClient, type TdxClientOptions } from 'tdx-taiwan';

/** Injection token for the resolved `TdxClientOptions`. */
export const TDX_OPTIONS: InjectionToken = Symbol('TDX_OPTIONS');

export interface TdxModuleOptions extends TdxClientOptions {
  /** Register the module globally so `TdxClient` is injectable everywhere. Default: false. */
  isGlobal?: boolean;
}

export interface TdxModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /** Register the module globally so `TdxClient` is injectable everywhere. Default: false. */
  isGlobal?: boolean;
  /** Builds the client options, e.g. from `ConfigService`. */
  useFactory: (...args: never[]) => TdxClientOptions | Promise<TdxClientOptions>;
  /** Providers passed to `useFactory`. */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
}

const clientProvider: FactoryProvider<TdxClient> = {
  provide: TdxClient,
  useFactory: (options: TdxClientOptions) => new TdxClient(options),
  inject: [TDX_OPTIONS],
};

/**
 * NestJS integration. Provides a singleton `TdxClient`, injectable by its class.
 *
 * @example
 * TdxModule.forRoot({ clientId, clientSecret, isGlobal: true })
 *
 * TdxModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     clientId: config.getOrThrow('TDX_CLIENT_ID'),
 *     clientSecret: config.getOrThrow('TDX_CLIENT_SECRET'),
 *   }),
 * })
 */
@Module({})
export class TdxModule {
  static forRoot(options: TdxModuleOptions): DynamicModule {
    const { isGlobal, ...clientOptions } = options;
    return {
      module: TdxModule,
      global: isGlobal ?? false,
      providers: [{ provide: TDX_OPTIONS, useValue: clientOptions }, clientProvider],
      exports: [TdxClient, TDX_OPTIONS],
    };
  }

  static forRootAsync(options: TdxModuleAsyncOptions): DynamicModule {
    return {
      module: TdxModule,
      global: options.isGlobal ?? false,
      imports: options.imports ?? [],
      providers: [
        {
          provide: TDX_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        clientProvider,
      ],
      exports: [TdxClient, TDX_OPTIONS],
    };
  }
}
