import { describe, expect, it, mock } from "bun:test";
import { faker } from "@faker-js/faker";

const host = "http://localhost:3000";
const controllerPath = "/bus-stops";
const headers = {
  "Content-Type": "application/json",
};

const url = `${host}${controllerPath}`;

let busStopsIds: string[] = [];
describe("List/Search Bus stops", () => {
  it("List all bus stops", async () => {
    const response = await fetch(`${url}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(data).length).toBe(100);

    busStopsIds = Object.keys(data);
  });

  it("Search bus stops by name", async () => {
    const term = "port";
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

    expect(Object.keys(data).length).toBeLessThanOrEqual(100);
    expect(Object.keys(caseSensitivity).length).toBeLessThanOrEqual(100);

    // Check if all values include the substring
    const searchWork = Object.values(data).every((value: string) =>
      value.toLowerCase().includes(term)
    );
    const caseSensitivitySearchWork = Object.values(caseSensitivity).every(
      (value: string) => value.toLowerCase().includes(term)
    );

    // Assert that all values contain the substring
    expect(searchWork).toBe(true);
    expect(caseSensitivitySearchWork).toBe(true);
  });

  it("Search bus stops pagination", async () => {
    const term = "port";
    const response = await fetch(`${url}?offset=2`, {
      method: "GET",
      headers,
    });

    const data = (await response.json()) as { [key: string]: string };

    expect(response.status).toBe(200);
    expect(Object.keys(data).length).toBeLessThanOrEqual(100);
    expect(Object.keys(data)[0]).toBe("2");

    expect;
  });
});

describe("Get a Bus stops", () => {
  const invalidbusStopId = 999999;
  const randomStopId = mock(() => faker.helpers.arrayElement(busStopsIds));

  it("Get a bus stop infos", async () => {
    const stopId = randomStopId();
    const response = await fetch(`${url}/${stopId}`, {
      method: "GET",
      headers,
    });
    const data = (await response.json()) as {
      id: number;
      name: string;
      latitude: string;
      longitude: string;
      logicalId: string;
      linkedBusLines: { [key: string]: string };
    };

    expect(response.status).toBe(200);
    expect(data).toContainKeys([
      "id",
      "name",
      "latitude",
      "longitude",
      "logicalId",
      "linkedBusLines",
    ]);
    expect(data.id).toBe(parseInt(stopId));
    expect(data.linkedBusLines).toBeObject();

    const titleAreStrings = Object.values(data.linkedBusLines).every(
      (title: string) => typeof title === "string"
    );

    expect(titleAreStrings).toBeTrue();
  });

  it("Get an non-existing bus stop infos", async () => {
    const response = await fetch(`${url}/${invalidbusStopId}`, {
      method: "GET",
      headers,
    });
    const data: any = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.message).toBe(`Bus stop ${invalidbusStopId} not found`);
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

// describe("Update a Bus Line", () => {
//   const invalidbusLineId = 999999;
//   const randomLineId = mock(() => faker.helpers.arrayElement(busLineIds));
//   const randomDirection = mock(() => Math.floor(Math.random() * 2) + 1);

//   it("Update a bus line", async () => {
//     const newTitle = "New Title";
//     const lineId = randomLineId();

//     const response = await fetch(`${url}/${lineId}`, {
//       method: "PUT",
//       headers,
//       body: JSON.stringify({
//         title: newTitle,
//       }),
//     });
//     const data: any = await response.json();

//     expect(response.status).toBe(200);
//     expect(data).toContainKeys(["title", "route_no"]);
//     expect(data.route_no).toBe(lineId);
//     expect(data.title).toBe(newTitle);
//   });

//   it("Update an non-existing bus line", async () => {
//     const response = await fetch(`${url}/${invalidbusLineId}`, {
//       method: "GET",
//       headers,
//     });
//     const data: any = await response.json();

//     expect(response.status).toBe(404);
//     expect(data.error.message).toBe(`Bus line ${invalidbusLineId} not found`);
//   });
// });

// describe("Create a Bus Line", () => {
//   const minimalStopsPayload = {
//     inward: [
//       {
//         bus_stop_id: 1,
//         fare_stage: 0,
//         average_journey_time: 0,
//         direction: 1,
//         type: "break",
//       },
//       {
//         bus_stop_id: 2,
//         fare_stage: 0,
//         average_journey_time: 0,
//         direction: 1,
//         type: "break",
//       },
//     ],
//     outward: [
//       {
//         bus_stop_id: 2,
//         fare_stage: 0,
//         average_journey_time: 0,
//         direction: 1,
//         type: "break",
//       },
//       {
//         bus_stop_id: 1,
//         fare_stage: 0,
//         average_journey_time: 0,
//         direction: 1,
//         type: "break",
//       },
//     ],
//   };
//   it("Create a bus line", async () => {
//     const newTitle = "New Title";
//     const route_no = "New bus line";
//     const response = await fetch(`${url}/`, {
//       method: "POST",
//       headers,
//       body: JSON.stringify({
//         route_no,
//         title: newTitle,
//         stops: minimalStopsPayload,
//       }),
//     });
//     const data: any = await response.json();

//     expect(response.status).toBe(200);
//     expect(data).toContainKeys(["title", "route_no", "stops"]);
//     expect(data.route_no).toBe(route_no);
//     expect(data.title).toBe(newTitle);

//     expect(data.stops).toBeObject();
//     expect(data.stops).toBeArrayOfSize(4);
//   });

//   it("Create a bus line that already exist", async () => {
//     const response = await fetch(`${url}`, {
//       method: "POST",
//       headers,
//       body: JSON.stringify({
//         route_no: "1",
//         title: "New Line",
//         stops: minimalStopsPayload,
//       }),
//     });

//     const data: any = await response.json();

//     expect(response.status).toBe(400);
//     expect(data.error.message).toBe(`Route 1 already exists`);
//   });
// });
