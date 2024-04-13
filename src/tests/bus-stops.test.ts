import { describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";
import { treaty } from "@elysiajs/eden";
import { app } from "../app";

const api = treaty(app);

let busStopsIds: number[] = [];
describe("List/Search Bus stops", () => {
  const q = "port";

  it("List all bus stops", async () => {
    const { data, error, status } = await api["bus-stops"].index.get({
      query: {},
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(Object.keys(data).length).toBe(100);

    busStopsIds = Object.keys(data).map((id) => parseInt(id));
  });

  it("Search bus stops by name", async () => {
    const { data, error, status } = await api["bus-stops"].index.get({
      query: { q },
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);

    expect(Object.keys(data).length).toBeLessThanOrEqual(100);

    // Check if all values include the substring
    const searchWork = Object.values(data).every((value) =>
      value?.toLowerCase().includes(q)
    );

    // Assert that all values contain the substring
    expect(searchWork).toBe(true);
  });

  it("Search bus lines by description case sensitivity", async () => {
    const { data, error, status } = await api["bus-stops"].index.get({
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

  it("Search bus stops pagination", async () => {
    const { data, error, status } = await api["bus-stops"].index.get({
      query: { q: q.toUpperCase(), offset: "2" },
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(Object.keys(data).length).toBeLessThanOrEqual(100);
    expect(Object.keys(data)[0]).toBe("96");
  });
});

describe("Get a Bus stops", () => {
  const invalidbusStopId = 999999;
  const randomStopId = mock(() => faker.helpers.arrayElement(busStopsIds));

  it("Get a bus stop infos", async () => {
    const bus_stop_id = randomStopId();
    const { data, error, status } = await api["bus-stops"]({
      bus_stop_id,
    }).get();

    if (error) {
      throw error.value;
    }
    expect(status).toBe(200);
    expect(data).toContainKeys([
      "id",
      "name",
      "latitude",
      "longitude",
      "logicalId",
      "linkedBusLines",
    ]);
    expect(data.id).toBe(bus_stop_id);
    expect(data.linkedBusLines).toBeObject();

    const titleAreStrings = Object.values(data.linkedBusLines).every(
      (title) => typeof title === "string"
    );

    expect(titleAreStrings).toBeTrue();
  });

  it("Get an non-existing bus stop infos", async () => {
    const { data, error, status } = await api["bus-stops"]({
      bus_stop_id: invalidbusStopId,
    }).get();

    expect(error).toBeObject();
    if (error) {
      const value = error.value as { error: { name: string; message: string } };

      expect(status).toBe(404);
      expect(value.error.message).toBe(
        `Bus stop ${invalidbusStopId} not found`
      );
    }
  });
});

describe("Get a Bus stops Log", () => {
  // TODO
  // 1. All logs
  // 2. All logs of a single line
});

describe("Nearest Bus stop", () => {
  // TODO
});

describe("Update a Bus stop", () => {
  const invalidbusStopId = 999999;
  const newName = "New Bus Stop Name";
  const randomBusStopId = mock(() => faker.helpers.arrayElement(busStopsIds));

  it("Update a bus stop", async () => {
    const bus_stop_id = randomBusStopId();

    const { data, error, status } = await api["bus-stops"]({
      bus_stop_id,
    }).put({ name: newName, latitude: 0, longitude: 1 });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys([
      "id",
      "name",
      "latitude",
      "longitude",
      "logicalId",
    ]);
    expect(data.id).toBe(bus_stop_id);
    expect(data.name).toBe(newName);
    expect(data.latitude).toBe(0);
    expect(data.longitude).toBe(1);
  });

  it("Update an non-existing bus line", async () => {
    const { data, error, status } = await api["bus-stops"]({
      bus_stop_id: invalidbusStopId,
    }).get({});

    expect(error).toBeObject();
    if (error) {
      const value = error.value as { error: { name: string; message: string } };

      expect(status).toBe(404);

      expect(value.error.name).toBe(`Not Found`);
      expect(value.error.message).toBe(
        `Bus stop ${invalidbusStopId} not found`
      );
    }
  });
});

describe("Bus Stop Creation", () => {
  const newName = "New Bus Stop Name";

  it("Create a bus Stop", async () => {
    const { data, error, status } = await api["bus-stops"].index.post({
      name: newName,
      latitude: 0,
      longitude: 1,
    });

    if (error) {
      throw error.value;
    }

    expect(status).toBe(200);
    expect(data).toContainKeys([
      "id",
      "name",
      "latitude",
      "longitude",
      "logicalId",
    ]);
    expect(data.name).toBe(newName);
    expect(data.latitude).toBe(0);
    expect(data.longitude).toBe(1);
  });
});
