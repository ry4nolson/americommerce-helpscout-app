var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var path = require("path");
var tracking = require("tracking-url");
var datejs = require("datejs");

var app = express(), router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.route("/:domain/:apiKey").get(function(req, res){ res.json("use POST"); }).post(function(req, res){
  var domain = req.params.domain, apiKey = req.params.apiKey, customerEmail = req.body.customer.email;
  
  var instance = axios.create({
    baseURL: `https://${domain}/api/v1/`,
    headers: {'X-AC-Auth-Token': apiKey}
  });
  
  instance.get("customer_types").then(function(customerTypeResponse){
    var customerTypes = customerTypeResponse.data.customer_types;
    instance.get(`customers?email=${customerEmail}`).then(function(customerResponse){
      if (customerResponse.data.customers.length) {
        var customer = customerResponse.data.customers[0];
        
        instance.get("order_statuses").then(function(statusResponse){
          var statuses = statusResponse.data.order_statuses;
          var goodStatuses = statuses.filter(s => (!s.is_declined && !s.is_cancelled)).map(s => s.id);
          instance.get(`orders?customer_id=${customer.id}&expand=shipments`).then(function(orderResponse){
            
            var orders = orderResponse.data.orders.sort((a, b) => (a.id > b.id ? -1 : 1 ));
            var total=0;
            var orderList = "";
            var goodOrderCount = 0;
            
            orders.forEach((o,i) => {
              var status = statuses.find(s => s.id == o.order_status_id);
              if (goodStatuses.indexOf(status.id) > -1){
                total+= o.grand_total;
                goodOrderCount++;
              }
              
              var shipments = ""
              if (o.shipments.length){
                o.shipments.forEach((s,i) => {
                  var trackingData = tracking(s.tracking_numbers);
                  shipments += `<a href="${trackingData.url}">${trackingData.name} - ${s.tracking_numbers}</a> `;
                })
              }
                
              orderList += `<div><hr style="margin:2px 0">
                            <div style="float:right; font-weight:bold; color:${status.color}">${status.name}</div>
                            <a href="https://${domain}/store/admin/orders/viewOrder.aspx?orderid=${o.id}">#${o.id}</a> - $${o.grand_total}<br>
                            ${(new Date(o.ordered_at)).toString("M/d/yyyy")}
                            <div>${shipments}</div>
                            </div>`
            });
            var average = goodOrderCount > 0 ? total / goodOrderCount : 0.00;
            var customerType = customerTypes.find(t => t.id == (customer.customer_type_id || 1))
            
            res.json({
              "html" : `<h4><a href="https://${domain}/store/admin/customers/customeredit.aspx?id=${customer.id}">
                        ${customer.first_name} ${customer.last_name}</a></h4>
                        <div><strong>Customer type:</strong> ${customerType.name}</div>
                        <div><strong>Customer since:</strong> ${(new Date(customer.registered_at)).toString("M/d/yyyy")}</div>
                        <div><strong>Lifetime value:</strong> $${total.toFixed(2)}</div>
                        <div><strong>Average order:</strong> $${average.toFixed(2)}</div>
                        <br>
                        <h4>Orders (${orders.length} order${orders.length == 1 ? "" : "s"}) - 
                        <a href="https://${domain}/store/admin/accounting/OrderEdit.aspx?customerid=${customer.id}">New Order</a></h4>
                        ${orderList}`
            });
          });
          
        });
      } else { res.json({ "html" : "No customer found" }); }
    });
  });
});

app.get("/", function(req, res){
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.use("/api", router)

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  console.log("working")
});