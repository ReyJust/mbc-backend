import { describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";

const host = "http://localhost:3000";
const controllerPath = "/bus-lines";
const headers = {
  "Content-Type": "application/json",
};

const url = `${host}${controllerPath}`;

let busLineIds: string[] = [];
describe("List/Search Bus Lines", () => {
  it("List all bus lines", async () => {
    const response = await fetch(`${url}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(data).length).toBe(301);

    busLineIds = Object.keys(data);
  });

  it("Search bus lines by description", async () => {
    const term = "port louis";
    const response = await fetch(`${url}?q=${term}`, {
      method: "GET",
      headers,
    });
    const caseSensitivity = await fetch(`${url}?q=${term.toUpperCase()}`, {
      method: "GET",
      headers,
    });

    const data = (await response.json()) as { [key: string]: string };
    const caseSensitivityData = (await caseSensitivity.json()) as {
      [key: string]: string;
    };

    expect(response.status).toBe(200);
    expect(caseSensitivity.status).toBe(200);

    // Check if all values include the substring
    const searchWork = Object.values(data).every((value: string) =>
      value.toLowerCase().includes(term)
    );
    const caseSensitivitySearchWork = Object.values(caseSensitivity).every(
      (value: string) => value.toLowerCase().includes(term)
    );

    // Assert that all values contain the substring
    expect(searchWork).toBeTruthy();
    expect(caseSensitivitySearchWork).toBeTruthy();
  });

  it("Search bus lines by Line No", async () => {
    const term = "20";
    const response = await fetch(`${url}?q=${term}`, {
      method: "GET",
      headers,
    });

    const data = (await response.json()) as { [key: string]: string };

    expect(response.status).toBe(200);

    // Check if all values include the substring
    const searchFilterCheck = Object.keys(data).every((value: string) =>
      value.toLowerCase().includes(term)
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
    const response = await fetch(`${url}/${lineId}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
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
    const response = await fetch(`${url}/${lineId}?direction=${direction}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
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
    const response = await fetch(`${url}/${invalidbusLineId}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.message).toBe(`Bus line ${invalidbusLineId} not found`);
  });
});

describe("Update a Bus Line", () => {
  const invalidbusLineId = 999999;
  const randomLineId = mock(() => faker.helpers.arrayElement(busLineIds));
  const randomDirection = mock(() => Math.floor(Math.random() * 2) + 1);

  it("Update a bus line", async () => {
    const newTitle = "New Title";
    const lineId = randomLineId();

    const response = await fetch(`${url}/${lineId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        title: newTitle,
      }),
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data).toContainKeys(["title", "route_no"]);
    expect(data.route_no).toBe(lineId);
    expect(data.title).toBe(newTitle);
  });

  it("Update an non-existing bus line", async () => {
    const response = await fetch(`${url}/${invalidbusLineId}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.message).toBe(`Bus line ${invalidbusLineId} not found`);
  });
});

describe("Create a Bus Line", () => {
  const minimalStopsPayload = {
    inward: [
      {
        bus_stop_id: 1,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break",
      },
      {
        bus_stop_id: 2,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break",
      },
    ],
    outward: [
      {
        bus_stop_id: 2,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break",
      },
      {
        bus_stop_id: 1,
        fare_stage: 0,
        average_journey_time: 0,
        direction: 1,
        type: "break",
      },
    ],
  };
  it("Create a bus line", async () => {
    const newTitle = "New Title";
    const route_no = "New bus line";
    const response = await fetch(`${url}/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        route_no,
        title: newTitle,
        stops: minimalStopsPayload,
      }),
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data).toContainKeys(["title", "route_no", "stops"]);
    expect(data.route_no).toBe(route_no);
    expect(data.title).toBe(newTitle);

    expect(data.stops).toBeObject();
    expect(data.stops).toBeArrayOfSize(4);
  });

  it("Create a bus line that already exist", async () => {
    const response = await fetch(`${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        route_no: "1",
        title: "New Line",
        stops: minimalStopsPayload,
      }),
    });

    const data: any = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.message).toBe(`Route 1 already exists`);
  });
});
