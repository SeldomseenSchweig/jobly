"use strict";

const req = require("express/lib/request");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(query) {


    if(query === undefined ||Object.keys(query).length === 0){
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         ORDER BY name`);
         return companiesRes.rows;


    }

    
    /**  This section iterates through the 
     query-string-variable and creates a string for the
     WHERE secton of the sql query and an array for the 
     values sanitizing section of the SQL query **/

    let values = []
    let cols = ""
    values.length = Object.values(query).length-1
    let keys = Object.keys(query)
    if(query.min_employees > query.max_employees){
      throw new ExpressError(`Your minimum employees (${query.min_employees})
        must be fewer than you maximum employees(${query.max_employees})`, 404)
    }
   keys.map((colName, idx) => 
   {
     if( colName === "name"){
      cols+=(`LOWER(name) LIKE $${idx + 1}`)
       values[idx] = `%${query[colName].toLowerCase()}%`

     }else if(colName === 'min_employees'){
       if(query.name){
        cols+=`AND num_employees > $${idx + 1} `
        values[idx] = Number(query[colName])
       }else{
        cols+=`num_employees > $${idx + 1}`
        values[idx] = Number(query[colName])

       }

     }else if(colName === 'max_employees' ){
      if( query.name || query.min_employees){
        cols+=` AND num_employees < $${idx + 1}`
        values[idx] = Number(query[colName])

      }else{
        cols+=`num_employees < $${idx + 1}`
        values[idx] = Number(query[colName])
      }

     }
    
  });
  

if(query.min_employees || query.max_employees){
  const companiesRes = await db.query(
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
     FROM companies
     WHERE ${cols} 
     ORDER BY name`, values);
    
return companiesRes.rows;

}else{

const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                logo_url AS "logoUrl"
         FROM companies
         WHERE ${cols} 
         ORDER BY name`, values);
         
return companiesRes.rows;
  }


    }


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {

    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);
        console.log("+++++++++++++++++++++++++")
        console.log("+++++++++++++++++++++++++")
        console.log(handle)
        console.log("+++++++++++++++++++++++++")
        const jobRes = await db.query(
          `SELECT id,
                  title,
                  equity,
                  salary,
           FROM jobs
           WHERE company_handle = $1`
        [handle]);



    const company = companyRes.rows[0];


    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
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

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
