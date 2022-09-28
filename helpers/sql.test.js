

const { sqlForPartialUpdate } = require("./sql");




describe("sqlForPartialUpdate", function () {
    test("partially updates the test datbase",function () {
       dataToUpdate =  {firstName: "Aliya", lastName: "Slip" }
       jsToSql = { firstName:"first_name",lastName:"last_name"}
       result = sqlForPartialUpdate(dataToUpdate,jsToSql);
       expect(result).toEqual({ setCols:"\"first_name\"=$1, \"last_name\"=$2", values:["Aliya", "Slip"]})

    })


    test("partially updates the test datbase with admin",function () {
        dataToUpdate =  {firstName: "Mike", lastName: "Tipper", isAdmin:false }
        jsToSql = { firstName:"first_name",lastName:"last_name", isAdmin:"is_admin"}
        result = sqlForPartialUpdate(dataToUpdate,jsToSql);
        expect(result).toEqual({ setCols:"\"first_name\"=$1, \"last_name\"=$2, \"is_admin\"=$3", values:["Mike", "Tipper",false]})
 
     })

 
});




  