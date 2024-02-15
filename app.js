require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var cron = require('node-cron');
const http = require('http');
const axios = require('axios');
const xml2js = require('xml2js');

const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


// cron.schedule("*/10 * * * * *", async () => {
//   await axios.get('https://hook.us1.make.com/rx33x2dsf5v8fkq0aj1r3c4onapvj6ka').then(res => {
    
//   });
// });

axios.get('https://hook.us1.make.com/rx33x2dsf5v8fkq0aj1r3c4onapvj6ka').then(async res => {

  const xmlData = res.data;
  let reportData = [];
  await xml2js.parseString(xmlData, (err, result) => {
    if (err) throw err;
    reportData = result.AmazonEnvelope.Message[0].SettlementReport;
  });

  let orderData = reportData[0].Order;
  let refundData = reportData[0].Refund;
  let otherData = reportData[0].OtherTransaction;
  
  for (const Order of orderData) {
    let FulfillmentIDs = [];
    for (const Fulfillment of Order.Fulfillment) {
      let ItemIDs = [];
      for (const Item of Fulfillment.Item) {
        let ItemPriceIDs = [];
        let ItemFeesIDs = [];
        for(const ItemPrice of Item.ItemPrice) {
          let ComponentIDs = []
          for(const Component of ItemPrice.Component) {
            const ComponentID = await base("Component").create({
              "Type": Component.Type[0],
              "Amount": Number(Component.Amount[0]['_'])
            });
            // console.log('11111', ComponentID.id)
            await ComponentIDs.push(ComponentID.id);
          }
          const ItemPriceID = await base("ItemPrice").create({
            "Component": ComponentIDs
          });
          // console.log('22222', ItemPriceID.id)
          await ItemPriceIDs.push(ItemPriceID.id);
        }

        for (const ItemFees of Item.ItemFees) {
          let FeeIDs = []
          for (const Fee of ItemFees.Fee) {
            const FeeID = await base("Fee").create({
              "Type": Fee.Type[0],
              "Amount": Number(Fee.Amount[0]['_'])
            });
            // console.log('33333', FeeID.id)
            await FeeIDs.push(FeeID.id);
          }
          const ItemFeesID = await base("ItemFees").create({
            "Fee": FeeIDs
          });
          // console.log('44444', ItemFeesID.id)
          await ItemFeesIDs.push(ItemFeesID.id);
        }
        const ItemID = await base("Item").create({
          "AmazonOrderItemCode": Number(Item.AmazonOrderItemCode[0]),
          "SKU": Item.SKU[0],
          "Quantity": Number(Item.Quantity[0]),
          "ItemPrice": ItemPriceIDs,
          "ItemFees": ItemFeesIDs
        });
        await ItemIDs.push(ItemID.id);
      }

      const FulfillmentID = await base("Fulfillment").create({
        "MerchantFulfillmentID": Fulfillment.MerchantFulfillmentID[0],
        "PostedDate": Fulfillment.PostedDate[0],
        "Item": ItemIDs
      });
      await FulfillmentIDs.push(FulfillmentID.id);
    }

    const OrderID = await base("Transaction Data").create({
      "AmazonOrderID": Order.AmazonOrderID[0],
      "TransactionType": "order",
      "MerchantOrderID": Order.MerchantOrderID[0],
      "ShipmentID": Order.ShipmentID[0],
      "MarketplaceName": Order.MarketplaceName[0],
      "Fulfillment": FulfillmentIDs
    });

    console.log('Created---Order')
  }

  for (const Refund of refundData) {
    let FulfillmentIDs = [];
    for (const Fulfillment of Refund.Fulfillment) {
      let ItemIDs = [];
      for (const Item of Fulfillment.AdjustedItem) {
        let ItemPriceIDs = [];
        let ItemFeesIDs = [];
        for(const ItemPrice of Item.ItemPriceAdjustments) {
          let ComponentIDs = []
          for(const Component of ItemPrice.Component) {
            const ComponentID = await base("Component").create({
              "Type": Component.Type[0],
              "Amount": Number(Component.Amount[0]['_'])
            });
            await ComponentIDs.push(ComponentID.id);
          }
          const ItemPriceID = await base("ItemPrice").create({
            "Component": ComponentIDs
          });
          await ItemPriceIDs.push(ItemPriceID.id);
        }

        for (const ItemFees of Item.ItemFeeAdjustments) {
          let FeeIDs = []
          for (const Fee of ItemFees.Fee) {
            const FeeID = await base("Fee").create({
              "Type": Fee.Type[0],
              "Amount": Number(Fee.Amount[0]['_'])
            });
            await FeeIDs.push(FeeID.id);
          }
          const ItemFeesID = await base("ItemFees").create({
            "Fee": FeeIDs
          });
          await ItemFeesIDs.push(ItemFeesID.id);
        }
        const ItemID = await base("Item").create({
          "AmazonOrderItemCode": Number(Item.AmazonOrderItemCode[0]),
          "SKU": Item.SKU[0],
          "Quantity": Number(Item.MerchantAdjustmentItemID[0]),
          "ItemPrice": ItemPriceIDs,
          "ItemFees": ItemFeesIDs
        });
        await ItemIDs.push(ItemID.id);
      }

      const FulfillmentID = await base("Fulfillment").create({
        "MerchantFulfillmentID": Fulfillment.MerchantFulfillmentID[0],
        "PostedDate": Fulfillment.PostedDate[0],
        "Item": ItemIDs
      });
      await FulfillmentIDs.push(FulfillmentID.id);
    }

    const RefundID = await base("Transaction Data").create({
      "AmazonOrderID": Refund.AmazonOrderID[0],
      "TransactionType": "refund",
      "MerchantOrderID": Refund.MerchantOrderID[0],
      "ShipmentID": Refund.AdjustmentID[0],
      "MarketplaceName": Refund.MarketplaceName[0],
      "Fulfillment": FulfillmentIDs
    });

    console.log('Created---Refund')
  }

  for (const Other of otherData) {
    let ItemFeesIDs = [];

    if(Other.Fees) {
      for (const ItemFees of Other.Fees) {
        let FeeIDs = []
        for (const Fee of ItemFees.Fee) {
          const FeeID = await base("Fee").create({
            "Type": Fee.Type[0],
            "Amount": Number(Fee.Amount[0]['_'])
          });
          await FeeIDs.push(FeeID.id);
        }
        const ItemFeesID = await base("ItemFees").create({
          "Fee": FeeIDs
        });
        await ItemFeesIDs.push(ItemFeesID.id);
      }
    }

    const ItemID = await base("Item").create({
      "Quantity": Number(Other.Amount[0]),
      "ItemFees": ItemFeesIDs
    });

    const FulfillmentID = await base("Fulfillment").create({
      "PostedDate": Other.PostedDate[0],
      "Item": [ItemID.id]
    });

    const OtherID = await base("Transaction Data").create({
      "AmazonOrderID": Other.AmazonOrderID ? Other.AmazonOrderID[0] : "",
      "TransactionType": Other.TransactionType[0],
      "MerchantOrderID": Other.TransactionID[0],
      "ShipmentID": Other.ShipmentID ? Other.ShipmentID[0] : "",
      "Fulfillment": [FulfillmentID.id]
    });

    console.log('Created--', Other.TransactionType)
  }

});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
