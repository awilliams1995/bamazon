Array.prototype.forEach2= function(a){
let l=this.length;
for(let i=0;i<l;i++) {
a(this[i]);
}
return undefined
};

var mysql = require('mysql');
var inquirer = require("inquirer");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "bamazon"
});

connection.connect(function (err) {
  if (err) throw err;
  console.log('connected as id ' + connection.threadId);
  initialize();
});

function initialize() {
  connection.query('SELECT * FROM products', function (error, res) {
    if (error) throw error;
    res.forEach2((x)=>{
      //total patch work here, should really run a function that determine longest character count through sql first 
      const length = 20;
      let list = [];
      for(key in x){
        let value = x[key];
        if(key != "price")
        {
        list.push(value);
        }else
          {
            value = parseFloat(value).toFixed(2);
            list.push(value);
          }
        list.push( " ".repeat(length - String(value).length))
      }
      list.pop();
      console.log(list.join(""));
    });
    beginPrompt(res.length);
  });
}

function beginPrompt(length) {
  var currentId;
  var updatedQuantity;
  var totalPrice;
  inquirer.prompt([
    {
      name: "id",
      message: `Enter item ID (0 < id < ${length + 1})`,
      type: "input",
      validate: function (input) {
        currentId = parseInt(input);
        var done = this.async();
        if (parseInt(input) > length) {
          done(`Please enter value < ${length + 1} and > 0`);
          return;
        } else {
          done(null, true)
        }
      }
    },
    {
      name: "pQty",
      message: `Enter number of units to buy`,
      type: "input",
      filter: function (input) {
        return new Promise(function (resolve, reject) {
          connection.query('SELECT * FROM products WHERE ?', [
            {
              item_id: currentId
            }
          ], function (error, res) {
            if (error) throw error;
            if(parseInt(input) > res[0].stock_quantity) {
              reject(`Not enough inventory, please enter a quantity <= ${res[0].stock_quantity}`);
            } else if(parseInt(input) <= 0) {
              reject(`Please enter qty > 0`);
            } else {
              updatedQuantity = res[0].stock_quantity - parseInt(input);
              totalPrice = parseInt(input)*res[0].price;
              resolve(input);
            }
          });
        })
      }
    }
  ]).then((input) => {
    updateQty(updatedQuantity, input.id);
    console.log(`Qty was: ${input.pQty}`);
    console.log(`New qty is: ${updatedQuantity}`);
    console.log(`ID was: ${input.id}`);
    console.log(`Total Price was : ${totalPrice}`);
  });
}

function updateQty(qty, id) {
  connection.query('UPDATE products SET ? WHERE ?',
    [
      {
        stock_quantity: qty
      },
      {
        item_id: id
      }
    ],
    function (error, res) {
    if (error) throw error;
   // console.log(res);
    initialize();
  });
}