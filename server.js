var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');

var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.route("/:domain/:apiKey").post(function(req, res){
  var domain = req.params.domain;
  var apiKey = req.params.apiKey;
  var customerEmail = req.body.customer.email;
  
  var instance = axios.create({
    baseURL: `https://${domain}/api/v1/`,
    headers: {'X-AC-Auth-Token': apiKey}
  });
  
  instance.get("customer_types").then(function(customerTypeResponse){
    var customerTypes = customerTypeResponse.data.customer_types;
    instance.get(`customers?email=${customerEmail}`).then(function(customerResponse){
      var customer = null;
      
      if (customerResponse.data.customers.length) {
        customer = customerResponse.data.customers[0];
        
        instance.get("order_statuses").then(function(statusResponse){
          var statuses = statusResponse.data.order_statuses;
          var goodStatuses = statuses.filter(s => (!s.is_declined && !s.is_cancelled)).map(s => s.id);
          instance.get(`orders?customer_id=${customer.id}`).then(function(orderResponse){
            
            var orders = orderResponse.data.orders;
            var total=0;
            var orderList = "";
            var goodOrderCount = 0;
            
            orders = orders.sort((a, b) => (a.id > b.id ? -1 : 1 ));
            
            orders.forEach((o,i) => {
              var status = statuses.find(s => s.id == o.order_status_id);
              if (goodStatuses.indexOf(status.id) > -1){
                total+= o.grand_total;
                goodOrderCount++;
              }
                
              orderList += `<div><hr style="margin:2px 0">
                            <div style="padding:2px; border-radius:5px; float:right; color:#fff; background:${status.color}">${status.name}</div>
                            <a href="https://${domain}/store/admin/orders/viewOrder.aspx?orderid=${o.id}">#${o.id}</a> - $${o.grand_total}<br>
                            ${(new Date(o.ordered_at)).toDateString()}
                            </div>`
            });
            var average = goodOrderCount > 0 ? total / goodOrderCount : 0.00;
            var customerType = customerTypes.find(t => t.id == (customer.customer_type_id || 1))
            
            res.json({
              "html" : `<div><strong><a href="https://${domain}/store/admin/orders/customeredit.aspx?id=${customer.id}">
                        ${customer.first_name} ${customer.last_name}</a></strong></div>
                        <div><strong>Customer type:</strong> ${customerType.name}</div>
                        <div><strong>Customer since:</strong> ${(new Date(customer.registered_at)).toDateString()}</div>
                        <div><strong>Lifetime value:</strong> $${total.toFixed(2)}</div>
                        <div><strong>Average order:</strong> $${average.toFixed(2)}</div>
                        <br>
                        <div><strong>Orders (${orders.length} order${orders.length == 1 ? "" : "s"})</strong></div>
                        ${orderList}`
            });
          });
          
        });
      } else {
        res.json({
          "html" : "No customer found"
        })
      }
    });
  });
});

app.use("/", router)


app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  console.log("working")
});
