import type {
  AfrGeneralTimetables,
  AfrGeneralTrainTimetable,
  AfrLine,
  AfrLines,
  AfrNetwork,
  AfrNetworks,
  AfrNews,
  AfrNewsList,
  AfrODFare,
  AfrODFares,
  AfrOperator,
  AfrOperators,
  AfrRoute,
  AfrRoutes,
  AfrShape,
  AfrShapes,
  AfrStation,
  AfrStationId,
  AfrStationOfLine,
  AfrStationOfLines,
  AfrStationOfRoute,
  AfrStationOfRoutes,
  AfrStations,
  AfrTrainType,
  AfrTrainTypes,
} from '../types/afr.js';
import { type ObjectRequester, type QueryInput, segment } from './requester.js';

/**
 * Alishan Forest Railway (阿里山林業鐵路) endpoints: `/v3/Rail/AFR/*`. Every method returns a
 * wrapper object (`UpdateTime`, `AuthorityCode`, …) whose data array the query applies to.
 */
export class AfrApi {
  constructor(private readonly object: ObjectRequester) {}

  /** Stations with position, address and phone. Cached with the static TTL. `GET /v3/Rail/AFR/Station` */
  stations(query?: QueryInput<AfrStation>): Promise<AfrStations> {
    return this.object('/v3/Rail/AFR/Station', query, 'static');
  }

  /** Lines: the main line and the 祝山, 眠月 and 神木 branches. Cached with the static TTL. `GET /v3/Rail/AFR/Line` */
  lines(query?: QueryInput<AfrLine>): Promise<AfrLines> {
    return this.object('/v3/Rail/AFR/Line', query, 'static');
  }

  /** Ordered stations of each line. Cached with the static TTL. `GET /v3/Rail/AFR/StationOfLine` */
  stationsOfLine(query?: QueryInput<AfrStationOfLine>): Promise<AfrStationOfLines> {
    return this.object('/v3/Rail/AFR/StationOfLine', query, 'static');
  }

  /** Service routes. Cached with the static TTL. `GET /v3/Rail/AFR/Route` */
  routes(query?: QueryInput<AfrRoute>): Promise<AfrRoutes> {
    return this.object('/v3/Rail/AFR/Route', query, 'static');
  }

  /** Ordered stations of each route. Cached with the static TTL. `GET /v3/Rail/AFR/StationOfRoute` */
  stationsOfRoute(query?: QueryInput<AfrStationOfRoute>): Promise<AfrStationOfRoutes> {
    return this.object('/v3/Rail/AFR/StationOfRoute', query, 'static');
  }

  /** The network record with map links and lines. Cached with the static TTL. `GET /v3/Rail/AFR/Network` */
  network(query?: QueryInput<AfrNetwork>): Promise<AfrNetworks> {
    return this.object('/v3/Rail/AFR/Network', query, 'static');
  }

  /** Line geometries as WKT. Cached with the static TTL. `GET /v3/Rail/AFR/Shape` */
  shapes(query?: QueryInput<AfrShape>): Promise<AfrShapes> {
    return this.object('/v3/Rail/AFR/Shape', query, 'static');
  }

  /** The operator with contact and booking URLs. Cached with the static TTL. `GET /v3/Rail/AFR/Operator` */
  operators(query?: QueryInput<AfrOperator>): Promise<AfrOperators> {
    return this.object('/v3/Rail/AFR/Operator', query, 'static');
  }

  /** Train types (中興號, 阿里山號, 祝客, …). Cached with the static TTL. `GET /v3/Rail/AFR/TrainType` */
  trainTypes(query?: QueryInput<AfrTrainType>): Promise<AfrTrainTypes> {
    return this.object('/v3/Rail/AFR/TrainType', query, 'static');
  }

  /**
   * The regular timetable with stops and running days, for all trains or one train number.
   * Cached with the static TTL. `GET /v3/Rail/AFR/GeneralTrainTimetable[/TrainNo/{TrainNo}]`
   */
  generalTimetable(query?: QueryInput<AfrGeneralTrainTimetable>): Promise<AfrGeneralTimetables>;
  generalTimetable(
    trainNo: string,
    query?: QueryInput<AfrGeneralTrainTimetable>,
  ): Promise<AfrGeneralTimetables>;
  generalTimetable(
    trainNoOrQuery?: string | QueryInput<AfrGeneralTrainTimetable>,
    query?: QueryInput<AfrGeneralTrainTimetable>,
  ): Promise<AfrGeneralTimetables> {
    const base = '/v3/Rail/AFR/GeneralTrainTimetable';
    if (typeof trainNoOrQuery === 'string') {
      return this.object(`${base}/TrainNo/${segment(trainNoOrQuery, 'trainNo')}`, query, 'static');
    }
    return this.object(base, trainNoOrQuery ?? query, 'static');
  }

  /**
   * Fares for every station pair, or between two station IDs. Cached with the static TTL.
   * `GET /v3/Rail/AFR/ODFare[/{OriginStationID}/to/{DestinationStationID}]`
   */
  odFare(query?: QueryInput<AfrODFare>): Promise<AfrODFares>;
  odFare(from: AfrStationId, to: AfrStationId, query?: QueryInput<AfrODFare>): Promise<AfrODFares>;
  odFare(
    fromOrQuery?: AfrStationId | QueryInput<AfrODFare>,
    to?: AfrStationId,
    query?: QueryInput<AfrODFare>,
  ): Promise<AfrODFares> {
    const base = '/v3/Rail/AFR/ODFare';
    if (typeof fromOrQuery === 'string') {
      const path = `${base}/${segment(fromOrQuery, 'from')}/to/${segment(to ?? '', 'to')}`;
      return this.object(path, query, 'static');
    }
    return this.object(base, fromOrQuery ?? query, 'static');
  }

  /** News. Cached with the real-time TTL. `GET /v3/Rail/AFR/News` */
  news(query?: QueryInput<AfrNews>): Promise<AfrNewsList> {
    return this.object('/v3/Rail/AFR/News', query, 'realtime');
  }
}
