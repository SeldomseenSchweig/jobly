"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 1000,
        equity: 0.4,
        company_handle: 'c3',
  };

  test("ok for users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
    title: "new",
      salary: 1000,
      equity: "0.4",
      company_handle: 'c3',},
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({        
        title: "new",
        salary: "1000",
        equity: 0.4,
        company_handle: 17,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
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
                company_handle:'c3'
              },
          ],
    });
  });

  test("fails: test next() id", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {


  test("works for anon", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
      let id = Number(job.id)
    const resp = await request(app).get(`/jobs/${job.id}`);
    expect(resp.body).toEqual({
      job: {
        title: job.title,
        salary: job.salary,
        equity: job.equity,
        company_handle: job.company_handle,

   
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app).get(`/jobs/${job.id}`);

    expect(resp.body).toEqual({
      job: {
        title: job.title,
        salary: job.salary,
        equity: job.equity,
        company_handle: job.company_handle,
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "C1-new",
          company_handle:job.company_handle
          
        })
        .set("authorization", `Bearer ${adminToken}`);


    expect(resp.body).toEqual({
      job: {
        id:job.id,
        company_handle: job.company_handle,
        title:  "C1-new",
        salary: job.salary,
        equity: job.equity
      },
    });
  });

  test("unauth for anon", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on job change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
      
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app)
        .delete(`/jobs/${job.id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: job.id });
  });

  test("unauth for anon", async function () {
    const jobRes = await db.query(
        `SELECT *
         FROM jobs`);
      const job = jobRes.rows[0]
    const resp = await request(app)
        .delete(`/jobs/${job.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});





