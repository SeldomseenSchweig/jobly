const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

 /** Given partial informaton about 
   * an item it will make an object from the data.
   * This is used in models/companies in function update 
   * and models/users in function update.
   
   * It takes data to be updated with the columns and returns an 
   * object with two items: a string of table columns with
   * the "$" for data sanitizing, and the values which 
   * are going to be updated 
    
   * Sample input:
   * 
   * sqlForPartialUpdate( { firstName, lastName, isAdmin } , 
   * {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        })
   * returns { setCols:"firstName = $1, lastName=$2, isAdmin=$3",["john", "mo", "false"]},


   }
   *
   * 
   **/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
