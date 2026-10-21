import type {
  EvChargingPoint,
  EvChargingPoints,
  EvChargingRate,
  EvChargingRates,
  EvCity,
  EvConnector,
  EvConnectors,
  EvLiveStatus,
  EvLiveStatuses,
  EvStation,
  EvStations,
} from '../types/ev.js';
import { type ObjectRequester, type QueryInput, segment } from './requester.js';

/**
 * EV charging (充電樁) endpoints by city, plus freeway service areas under `freeway`. Every
 * response is a wrapper object; queries apply to the items inside it. Join stations, charging
 * points, connectors, live statuses and rates on `StationID`, `ChargingPointID` and `ConnectorID`
 * in code: TDX rejects those ID fields in `$filter` / `$select` / `$orderby`.
 */
export class EvApi {
  /** Chargers at freeway service areas. */
  readonly freeway: EvFreewayApi;

  constructor(private readonly object: ObjectRequester) {
    this.freeway = new EvFreewayApi(object);
  }

  /**
   * Charging stations in a city. Cached with the static TTL.
   * `GET /v1/EV/Station/City/{City}`
   */
  stations(city: EvCity, query?: QueryInput<EvStation>): Promise<EvStations> {
    return this.object(`/v1/EV/Station/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Charging points (chargers) in a city. Cached with the static TTL.
   * `GET /v1/EV/ChargingPoint/City/{City}`
   */
  chargingPoints(city: EvCity, query?: QueryInput<EvChargingPoint>): Promise<EvChargingPoints> {
    return this.object(`/v1/EV/ChargingPoint/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Connectors (plugs) in a city, with type and power. Cached with the static TTL.
   * `GET /v1/EV/Connector/City/{City}`
   */
  connectors(city: EvCity, query?: QueryInput<EvConnector>): Promise<EvConnectors> {
    return this.object(`/v1/EV/Connector/City/${segment(city, 'city')}`, query, 'static');
  }

  /**
   * Whether each connector in a city is free, in use or out of order. Cached with the real-time
   * TTL. `GET /v1/EV/ConnectorLiveStatus/City/{City}`
   */
  liveStatus(city: EvCity, query?: QueryInput<EvLiveStatus>): Promise<EvLiveStatuses> {
    return this.object(
      `/v1/EV/ConnectorLiveStatus/City/${segment(city, 'city')}`,
      query,
      'realtime',
    );
  }

  /**
   * Charging prices per connector in a city. Cached with the static TTL.
   * `GET /v1/EV/ChargingRate/City/{City}`
   */
  chargingRates(city: EvCity, query?: QueryInput<EvChargingRate>): Promise<EvChargingRates> {
    return this.object(`/v1/EV/ChargingRate/City/${segment(city, 'city')}`, query, 'static');
  }
}

/** EV chargers at freeway service areas (高速公路服務區). */
export class EvFreewayApi {
  constructor(private readonly object: ObjectRequester) {}

  /** `GET /v1/EV/Station/Freeway/ServiceArea`. Cached with the static TTL. */
  stations(query?: QueryInput<EvStation>): Promise<EvStations> {
    return this.object('/v1/EV/Station/Freeway/ServiceArea', query, 'static');
  }

  /** `GET /v1/EV/ChargingPoint/Freeway/ServiceArea`. Cached with the static TTL. */
  chargingPoints(query?: QueryInput<EvChargingPoint>): Promise<EvChargingPoints> {
    return this.object('/v1/EV/ChargingPoint/Freeway/ServiceArea', query, 'static');
  }

  /** `GET /v1/EV/Connector/Freeway/ServiceArea`. Cached with the static TTL. */
  connectors(query?: QueryInput<EvConnector>): Promise<EvConnectors> {
    return this.object('/v1/EV/Connector/Freeway/ServiceArea', query, 'static');
  }

  /** `GET /v1/EV/ConnectorLiveStatus/Freeway/ServiceArea`. Cached with the real-time TTL. */
  liveStatus(query?: QueryInput<EvLiveStatus>): Promise<EvLiveStatuses> {
    return this.object('/v1/EV/ConnectorLiveStatus/Freeway/ServiceArea', query, 'realtime');
  }

  /** `GET /v1/EV/ChargingRate/Freeway/ServiceArea`. Cached with the static TTL. */
  chargingRates(query?: QueryInput<EvChargingRate>): Promise<EvChargingRates> {
    return this.object('/v1/EV/ChargingRate/Freeway/ServiceArea', query, 'static');
  }
}
