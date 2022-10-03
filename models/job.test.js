"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./Job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 0.4,
    company_handle: 'c3',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
    title: "new",
    salary: 1000,
    equity: 0.4,
    company_handle: 'c3',
  });

    const result = await db.query(
          `SELECT title, equity, salary, company_handle
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        title: "new",
        equity: "0.4",
        salary: 1000,
        company_handle: 'c3',
      },
    ]);
  });

//   test("bad request with dupe", async function () {
//     try {
//       await Job.create(newJob);
//       await Job.create(newJob);
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        equity: "0.1",
        salary: 1000,
        company_handle:'c1'
       
      },
      {
        id: expect.any(Number),
        title: "j2",
        equity: "0.2",
        salary: 2000,
        company_handle:'c2'
      },
      {
        id: expect.any(Number),
        title: "j3",
        equity: "0.3",
        salary: 3000,
        company_handle:'c1'
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      equity: .1,
      salary: 1000,
      company_handle: 'c1',
    });
  });

  test("not found if no such Job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {

  const updateData = {
    title: "New",
    equity: 0.1,
    salary: 4000,
    company_handle:'c3',
  };

  test("works", async function () {


    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: id,
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, equity, salary, comapany_handle
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
      id: id,
      title: "New",
      equity: .1,
      salary: 4000,
      company_handle: 'c3'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      equity: .1,
      salary: null,
      company_handle: null
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: id,
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, equity, salary, company_handle
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
      id: id,
      title: "New",
      equity: .1 ,
      salary: null,
      company_handle: null,
    }]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
      

    await Job.remove(result.rows[0].id);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=${result.rows[0].id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
