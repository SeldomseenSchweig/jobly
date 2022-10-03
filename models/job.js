"use strict";

const req = require("express/lib/request");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, company_handle }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if job already in database.
   * */
//    CREATE TABLE jobs (
//     id SERIAL PRIMARY KEY,
//     title TEXT NOT NULL,
//     salary INTEGER CHECK (salary >= 0),
//     equity NUMERIC CHECK (equity <= 1.0),
//     company_handle VARCHAR(25) NOT NULL
//       REFERENCES companies ON DELETE CASCADE
//   );

  static async create({id, title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT title, salary, equity, company_handle,
           FROM jobs
           WHERE id =$1`,
        [id,title, salary, equity, company_handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: id ${id}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handlel)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle"`,
        [
            title, salary, equity, company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query) {

    if(!query){

        const jobRes = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             ORDER BY title`);
            return jobRes.rows;


    }


    
    /**  This section iterates through the 
     query-string-variable and creates a string for the
     WHERE secton of the sql query and an array for the 
     values sanitizing section of the SQL query **/

    let values = []
    let cols = ""
    values.length = Object.values(query).length-1
    if(query.min_salary < 0){
      throw new ExpressError(`Your minimum salary (${query.min_salary})
        must be greater than 0`, 404)
    }
   keys.map((colName, idx) => 
   {
     if( colName === "title"){
      cols+=(`LOWER(name) LIKE $${idx + 1}`)
       values[idx] = `%${query[colName].toLowerCase()}%`

     }else if(colName === 'min_salary'){
       if(query.name){
        cols+=`AND salary > $${idx + 1} `
        values[idx] = Number(query[colName])
       }else{
        cols+=`salary > $${idx + 1}`
        values[idx] = Number(query[colName])

       }

     }else if(colName === 'hasEquity' ){
      if( query.name || query.min_salary){
        cols+=` AND has_equity = $${idx + 1}`
        values[idx] = query[colName]

      }else{
        cols+=`has_equity = $${idx + 1}`
        values[idx] = query[colName]
      }

     }
    
  });
  

if(query.hasEquity){
  const jobRes = await db.query(
    `SELECT title, salary, company_handle
     FROM jobs
     WHERE ${cols} 
     ORDER BY name`, values);
    
return jobRes.rows;

}else{

const jobRes = await db.query(
        `SELECT title, salary, equity, company_handle
         FROM jobs
         WHERE ${cols} 
         ORDER BY name`, values);

return jobRes.rows;
  }


    }


  /** Given a job id, return data about job.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,
        [handle]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No company: ${handle}`);

    return job;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data);
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING title, salary, equity, company_handle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1`,
        [id]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${id}`);
  }
}


module.exports = Company;