// ? A route stop that reference a bus stop
export interface IRouteStop {
  bus_stop_id: number;
  fare_stage: number;
  average_journey_time: number;
  direction: number;
  type: "via" | "break";
}
