import { describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";

import { treaty } from "@elysiajs/eden";
import { app } from "../app";

const api = treaty(app);

let busLineIds: string[] = [];
describe("List/Search Bus Lines", () => {
  const q = "port louis";

  it("List all bus lines", async () => {
    const { data, error, status } = await api["bus-lines"].index.get({
      query: {},
    });

    if (error) {
      throw error.value;
    }

    expect(error).toBeNull();
    expect(status).toBe(200);

    expect(data).toBeObject();

    if (data) {
      expect(Object.keys(data).length).toBe(301);

      busLineIds = Object.keys(data);
    }
  });

  it("Search bus lines by description", async () => {
    const { data, error, status } = await api["bus-lines"].index.get({
      query: { q },
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);

    // Check if all values include the substring
    const searchWork = Object.values(data).every((value) =>
      value?.toLowerCase().includes(q)
    );

    // Assert that all values contain the substring
    expect(searchWork).toBeTruthy();
  });

  it("Search bus lines by description case sensitivity", async () => {
    const { data, error, status } = await api["bus-lines"].index.get({
      query: { q: q.toUpperCase() },
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);

    // Check if all values include the substring
    const searchWork = Object.values(data).every((value) =>
      value?.toLowerCase().includes(q)
    );

    // Assert that all values contain the substring
    expect(searchWork).toBeTruthy();
  });

  it("Search bus lines by Line No", async () => {
    const q = "20";
    const { data, error, status } = await api["bus-lines"].index.get({
      query: { q },
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);

    // Check if all values include the substring
    const searchFilterCheck = Object.keys(data).every((value: string) =>
      value.toLowerCase().includes(q)
    );
    // Assert that all values contain the substring
    expect(searchFilterCheck).toBeTruthy();
  });
});

describe("Get a Bus Line", () => {
  const invalidbusLineId = 999999;
  const randomLineId = mock(() => faker.helpers.arrayElement(busLineIds));
  const randomDirection = mock(() => Math.floor(Math.random() * 2) + 1);

  it("Get a bus line infos", async () => {
    const lineId = randomLineId();

    const { data, error, status } = await api["bus-lines"]({
      route_no: lineId,
    }).get({ query: {} });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys(["title", "stops", "route_no"]);
    expect(data.route_no).toBe(lineId);
    expect(data.stops).toBeArray();

    expect(data.stops.length).toBeGreaterThanOrEqual(2);
    expect(data.stops[0].type).toBe("break");
    expect(data.stops[data.stops.length - 1].type).toBe("break");
  });

  it("Get a bus line infos filtering direction", async () => {
    const lineId = randomLineId();
    const direction = randomDirection();

    const { data, error, status } = await api["bus-lines"]({
      route_no: lineId,
    }).get({ query: { direction } });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys(["title", "stops", "route_no"]);
    expect(data.route_no).toBe(lineId);

    expect(data.stops).toBeArray();

    expect(data.stops.length).toBeGreaterThanOrEqual(2);
    expect(data.stops[0].type).toBe("break");
    expect(data.stops[data.stops.length - 1].type).toBe("break");

    const directionFilterCheck = data.stops.every(
      (busStop: any) => busStop.direction === direction
    );

    expect(directionFilterCheck).toBeTruthy();
  });

  it("Get an non-existing bus line infos", async () => {
    const { data, error, status } = await api["bus-lines"]({
      route_no: invalidbusLineId,
    }).get({ query: {} });

    expect(error).toBeObject();
    if (error) {
      const value = error.value as { error: { name: string; message: string } };

      expect(status).toBe(404);
      expect(value.error.name).toBe(`Not Found`);
      expect(value.error.message).toBe(
        `Bus line ${invalidbusLineId} not found`
      );
    }
  });
});

describe("Update a Bus Line", () => {
  const invalidbusLineId = 999999;
  const title = "New Title";
  const randomLineId = mock(() => faker.helpers.arrayElement(busLineIds));
  const randomDirection = mock(() => Math.floor(Math.random() * 2) + 1);

  it("Update a bus line", async () => {
    const lineId = randomLineId();
    const { data, error, status } = await api["bus-lines"]({
      route_no: lineId,
    }).put({ title });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys(["title", "route_no"]);
    expect(data.route_no).toBe(lineId);
    expect(data.title).toBe(title);
  });

  it("Update an non-existing bus line", async () => {
    const { data, error, status } = await api["bus-lines"]({
      route_no: invalidbusLineId,
    }).put({ title });

    expect(error).toBeObject();
    if (error) {
      const value = error.value as { error: { name: string; message: string } };

      expect(status).toBe(404);
      expect(value.error.name).toBe(`Not Found`);
      expect(value.error.message).toBe(
        `Bus line ${invalidbusLineId} not found`
      );
    }
  });
});

enum BusStopTypeEnum {
  VIA = "via",
  BREAK = "break",
}

describe("Create a Bus Line", () => {
  const title = "New Title";
  const newlineId = "New bus line";

  const minimalStopsPayload = {
    inward: [
      {
        bus_stop_id: 1,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break" as BusStopTypeEnum,
      },
      {
        bus_stop_id: 2,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break" as BusStopTypeEnum,
      },
    ],
    outward: [
      {
        bus_stop_id: 2,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break" as BusStopTypeEnum,
      },
      {
        bus_stop_id: 1,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break" as BusStopTypeEnum,
      },
    ],
  };

  it("Create a bus line", async () => {
    const { data, error, status } = await api["bus-lines"].index.post({
      route_no: newlineId,
      title,
      stops: minimalStopsPayload,
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys(["title", "route_no", "stops"]);
    expect(data.route_no).toBe(newlineId);
    expect(data.title).toBe(title);

    expect(data.stops).toBeObject();
    expect(data.stops).toBeArrayOfSize(4);
  });

  it("Create a bus line that already exist", async () => {
    const { data, error, status } = await api["bus-lines"].index.post({
      route_no: "1",
      title,
      stops: minimalStopsPayload,
    });

    expect(error).toBeObject();
    if (error) {
      expect(status).toBe(400);
      const value = error.value as { error: { name: string; message: string } };

      expect(value.error.message).toBe(`Route 1 already exists`);
    }
  });
});
