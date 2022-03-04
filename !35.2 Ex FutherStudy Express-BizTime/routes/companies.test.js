process.env.NODE_ENV = 'test';
// const { default: slugify } = require('slugify');

const request = require('supertest');
const app = require("../app");
const db = require("../db");

let testComp;
// before each test, clean out data
// beforeEach(createData);
beforeEach(async () => {
  let result = await db.query(`
  INSERT INTO companies (code, name, description) 
  VALUES ('TC', 'Test Company', 'This is a Test company') 
  RETURNING code, name, description`);
  testComp = result.rows[0];
});

// describe("GET /companies", () => {
//   test("It should respond with array of companies", async function () {
//     const res = await request(app).get("/companies");
//     expect(res.body).toEqual({
//       "companies": [
//         {code: "TC", name: "Test Company", description: "This is a Test company"}
//       ]
//     });
//   })

// });

describe("GET /", () => {
  test("Gets a list of companies", async () => {
     const res = await request(app).get('/companies');
     expect(res.statusCode).toEqual(200);
     expect(res.body).toEqual({
       companies: [testComp]
      })
  });
});


describe("GET /testComp", function () {

  test("It return company info", async function () {
    const res = await request(app).get("/companies/testComp");
    expect(res.body).toEqual({
      "companies": [
        {code: "TC", name: "Test Company", description: "This is a Test company"}
      ]
    });
  });

  test("It should return 404 for no-such-company", async function () {
    const res = await request(app).get("/companies/blargh");
    expect(res.status).toEqual(404);
  })
});


describe("POST /", () => {

  test("It should add company", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "Pizza", description: "Take it"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "PC",
            name: "Pizza",
            description: "Take it",
          }
        }
    );
  });

  test("It should return 500 for conflict", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "Test Company", description: "Huh?"});

    expect(response.status).toEqual(500);
  })
});


describe("PUT /", function () {

  test("It should update company", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({name: "AppleEdit", description: "NewDescrip"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "apple",
            name: "AppleEdit",
            description: "NewDescrip",
          }
        }
    );
  });

  test("It should return 500 for no-such-comp", async function () {
    const response = await request(app)
        .put("/companies/blargh")
        .send({name: "Blargh"});

    expect(response.status).toEqual(500);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({});

    expect(response.status).toEqual(500);
  })
});


describe("DELETE /companies/:code", function () {

  test("It should delete company", async function () {
    const response = await request(app)
        .delete(`/companies/${testComp.id}`);

    expect(response.body).toEqual({"status": "Test Company deleted"});
  });
//   expect(response.body).toEqual({ message: "Test Company deleted" });
// });
  test("It should return 404 for no-such-comp", async function () {
    const response = await request(app)
        .delete("/companies/Haha");

    expect(response.status).toEqual(404);
  });
});


afterEach(async () => {
  await db.query('DELETE FROM companies')
});

afterAll(async () => {
  await db.end()
})
