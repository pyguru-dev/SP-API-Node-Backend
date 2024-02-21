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
const axios = require('axios');
const xml2js = require('xml2js');
const csv = require('csvtojson');

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


function csvStringToJson(csvString) {
  // Split the string into lines and remove any empty lines
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  
  // Extract headers and trim \r from each header
  const headers = lines[0].split('\t').map(header => header.replace(/\r$/, ''));
  
  // Map the rest of the lines into objects
  const result = lines.slice(1).map(line => {
      // Split by tab, and for each value, trim \r if present
      const data = line.split('\t').map(value => value.replace(/\r$/, ''));
      return headers.reduce((obj, nextKey, index) => {
          obj[nextKey] = data[index];
          return obj;
      }, {});
  });
  
  return result;
}


cron.schedule("0 4 * * *", async () => {
  console.log("Process Started...\n")

/* Settlement Data */

  // axios.get('https://hook.us1.make.com/rx33x2dsf5v8fkq0aj1r3c4onapvj6ka').then(async res => {
  //   let reportData = [];
  //   await xml2js.parseString(res.data, (err, result) => {
  //     if (err) throw err;
  //     reportData = result.AmazonEnvelope.Message[0].SettlementReport;
  //   });

  //   let orderData = reportData[0].Order;
  //   let refundData = reportData[0].Refund;
  //   let otherData = reportData[0].OtherTransaction;
    
  //   for (const Order of orderData) {
  //     let FulfillmentIDs = [];
  //     for (const Fulfillment of Order.Fulfillment) {
  //       let ItemIDs = [];
  //       for (const Item of Fulfillment.Item) {
  //         let ItemPriceIDs = [];
  //         let ItemFeesIDs = [];
  //         for(const ItemPrice of Item.ItemPrice) {
  //           let ComponentIDs = []
  //           for(const Component of ItemPrice.Component) {
  //             const ComponentID = await base("Component").create({
  //               "Type": Component.Type[0],
  //               "Amount": Number(Component.Amount[0]['_'])
  //             });
  //             // console.log('11111', ComponentID.id)
  //             await ComponentIDs.push(ComponentID.id);
  //           }
  //           const ItemPriceID = await base("ItemPrice").create({
  //             "Component": ComponentIDs
  //           });
  //           // console.log('22222', ItemPriceID.id)
  //           await ItemPriceIDs.push(ItemPriceID.id);
  //         }

  //         for (const ItemFees of Item.ItemFees) {
  //           let FeeIDs = []
  //           for (const Fee of ItemFees.Fee) {
  //             const FeeID = await base("Fee").create({
  //               "Type": Fee.Type[0],
  //               "Amount": Number(Fee.Amount[0]['_'])
  //             });
  //             // console.log('33333', FeeID.id)
  //             await FeeIDs.push(FeeID.id);
  //           }
  //           const ItemFeesID = await base("ItemFees").create({
  //             "Fee": FeeIDs
  //           });
  //           // console.log('44444', ItemFeesID.id)
  //           await ItemFeesIDs.push(ItemFeesID.id);
  //         }
  //         const ItemID = await base("Item").create({
  //           "AmazonOrderItemCode": Number(Item.AmazonOrderItemCode[0]),
  //           "SKU": Item.SKU[0],
  //           "Quantity": Number(Item.Quantity[0]),
  //           "ItemPrice": ItemPriceIDs,
  //           "ItemFees": ItemFeesIDs
  //         });
  //         await ItemIDs.push(ItemID.id);
  //       }

  //       const FulfillmentID = await base("Fulfillment").create({
  //         "MerchantFulfillmentID": Fulfillment.MerchantFulfillmentID[0],
  //         "PostedDate": Fulfillment.PostedDate[0],
  //         "Item": ItemIDs
  //       });
  //       await FulfillmentIDs.push(FulfillmentID.id);
  //     }

  //     const OrderID = await base("Transaction Data").create({
  //       "AmazonOrderID": Order.AmazonOrderID[0],
  //       "TransactionType": "order",
  //       "MerchantOrderID": Order.MerchantOrderID[0],
  //       "ShipmentID": Order.ShipmentID[0],
  //       "MarketplaceName": Order.MarketplaceName[0],
  //       "Fulfillment": FulfillmentIDs
  //     });

  //     console.log('Created---Order')
  //   }

  //   for (const Refund of refundData) {
  //     let FulfillmentIDs = [];
  //     for (const Fulfillment of Refund.Fulfillment) {
  //       let ItemIDs = [];
  //       for (const Item of Fulfillment.AdjustedItem) {
  //         let ItemPriceIDs = [];
  //         let ItemFeesIDs = [];
  //         for(const ItemPrice of Item.ItemPriceAdjustments) {
  //           let ComponentIDs = []
  //           for(const Component of ItemPrice.Component) {
  //             const ComponentID = await base("Component").create({
  //               "Type": Component.Type[0],
  //               "Amount": Number(Component.Amount[0]['_'])
  //             });
  //             await ComponentIDs.push(ComponentID.id);
  //           }
  //           const ItemPriceID = await base("ItemPrice").create({
  //             "Component": ComponentIDs
  //           });
  //           await ItemPriceIDs.push(ItemPriceID.id);
  //         }

  //         for (const ItemFees of Item.ItemFeeAdjustments) {
  //           let FeeIDs = []
  //           for (const Fee of ItemFees.Fee) {
  //             const FeeID = await base("Fee").create({
  //               "Type": Fee.Type[0],
  //               "Amount": Number(Fee.Amount[0]['_'])
  //             });
  //             await FeeIDs.push(FeeID.id);
  //           }
  //           const ItemFeesID = await base("ItemFees").create({
  //             "Fee": FeeIDs
  //           });
  //           await ItemFeesIDs.push(ItemFeesID.id);
  //         }
  //         const ItemID = await base("Item").create({
  //           "AmazonOrderItemCode": Number(Item.AmazonOrderItemCode[0]),
  //           "SKU": Item.SKU[0],
  //           "Quantity": Number(Item.MerchantAdjustmentItemID[0]),
  //           "ItemPrice": ItemPriceIDs,
  //           "ItemFees": ItemFeesIDs
  //         });
  //         await ItemIDs.push(ItemID.id);
  //       }

  //       const FulfillmentID = await base("Fulfillment").create({
  //         "MerchantFulfillmentID": Fulfillment.MerchantFulfillmentID[0],
  //         "PostedDate": Fulfillment.PostedDate[0],
  //         "Item": ItemIDs
  //       });
  //       await FulfillmentIDs.push(FulfillmentID.id);
  //     }

  //     const RefundID = await base("Transaction Data").create({
  //       "AmazonOrderID": Refund.AmazonOrderID[0],
  //       "TransactionType": "refund",
  //       "MerchantOrderID": Refund.MerchantOrderID[0],
  //       "ShipmentID": Refund.AdjustmentID[0],
  //       "MarketplaceName": Refund.MarketplaceName[0],
  //       "Fulfillment": FulfillmentIDs
  //     });

  //     console.log('Created---Refund')
  //   }

  //   for (const Other of otherData) {
  //     let ItemFeesIDs = [];

  //     if(Other.Fees) {
  //       for (const ItemFees of Other.Fees) {
  //         let FeeIDs = []
  //         for (const Fee of ItemFees.Fee) {
  //           const FeeID = await base("Fee").create({
  //             "Type": Fee.Type[0],
  //             "Amount": Number(Fee.Amount[0]['_'])
  //           });
  //           await FeeIDs.push(FeeID.id);
  //         }
  //         const ItemFeesID = await base("ItemFees").create({
  //           "Fee": FeeIDs
  //         });
  //         await ItemFeesIDs.push(ItemFeesID.id);
  //       }
  //     }

  //     const ItemID = await base("Item").create({
  //       "Quantity": Number(Other.Amount[0]),
  //       "ItemFees": ItemFeesIDs
  //     });

  //     const FulfillmentID = await base("Fulfillment").create({
  //       "PostedDate": Other.PostedDate[0],
  //       "Item": [ItemID.id]
  //     });

  //     const OtherID = await base("Transaction Data").create({
  //       "AmazonOrderID": Other.AmazonOrderID ? Other.AmazonOrderID[0] : "",
  //       "TransactionType": Other.TransactionType[0],
  //       "MerchantOrderID": Other.TransactionID[0],
  //       "ShipmentID": Other.ShipmentID ? Other.ShipmentID[0] : "",
  //       "Fulfillment": [FulfillmentID.id]
  //     });

  //     console.log('Created--', Other.TransactionType[0])
  //   }

  //   console.log("Process Ended...\n")

  // });


/* Order Transaction Data */
  axios.get('https://hook.us1.make.com/rx33x2dsf5v8fkq0aj1r3c4onapvj6ka').then(async res => {

    console.log("Process Started...\n");

    const orderData = csvStringToJson(res.data);

    for (const order of orderData) {
      base('Order Transaction').create({
        "Amazon Order ID": order['amazon-order-id'],
        "Merchant Order ID": order['merchant-order-id'],
        "Purchase Date": order['purchase-date'],
        "Last Updated Date": order['last-updated-date'],
        "Order Status": order['order-status'],
        "Fulfillment Channel": order['fulfillment-channel'],
        "Sales Channel": order['sales-channel'],
        "Order Channel": order['order-channel'],
        "Ship Service Level": order['ship-service-level'],
        "Product Name": order['product-name'],
        "SKU": order.sku,
        "ASIN": order.asin,
        "Item Status": order['item-status'],
        "Quantity": order.quantity ? Number(order.quantity) : '',
        "Currency": order.currency,
        "Item Price": order['item-price'] ? Number(order['item-price']) : null,
        "Item Tax": order['item-tax'] ? Number(order['item-tax']) : null,
        "Shipping Price": order['shipping-price'] ? Number(order['shipping-price']) : null,
        "Shipping Tax": order['shipping-tax'] ? Number(order['shipping-tax']) : null,
        "Item Promotion Discount": order['item-promotion-discount'] ? Number(order['item-promotion-discount']) : null,
        "Ship Promotion Discount": order['ship-promotion-discount'] ? Number(order['ship-promotion-discount']) : null,
        "Ship City": order['ship-city'],
        "Ship State": order['ship-state'],
        "Ship Postal Code": order['ship-postal-code'],
        "Ship Country": order['ship-country'],
        "Promotion IDs": order['promotion-ids'],
        "Is Business Order": order['is-business-order'],
        "Purchase Order Number": order['purchase-order-number'] ? Number(order.purchase-order-number) : null,
        "Price Designation": order['price-designation'],
        "Signature Confirmation Recommended": order['signature-confirmation-recommended']
      });
      console.log(`Created ${order['amazon-order-id']}`)
    }

    console.log("Process Ended...\n");
  });  
});
 

/*   Informed Listing Data    */

// const sdk = require('api')('@informed-api/v1.0#s8lm5yhl45z1p3y');
// sdk.auth('cSPrYSFqO9DGqsPNcRMFxx0yQv0bj7SBxuBpdbct');
// sdk.reportRequestList({status: 'Complete', startDate: '2024-02-18', endDate: '2024-02-19'})
//   .then(({ data }) => {
//     sdk.reportRequestStatus({reportRequestID: data.ReportRequests[0].ReportRequestID})
//       .then(async ({ data }) => {
//           try {
//             const response = await axios({
//               method: 'get',
//               url: data.DownloadLink,
//               responseType: 'text' 
//             });
//             let listingData = await csv().fromString(response.data);
//             for(const list of listingData) {
//               await base("Listings Data").create({
//                 "SKU": list.SKU,
//                 "Item ID": list.ITEM_ID,
//                 "Marketplace ID": list.MARKETPLACE_ID,  
//                 "Listing Title": list.TITLE,
//                 "Listing Type": list.LISTING_TYPE,
//                 "Featured": list.FEATURED,
//                 "Cost": list.COST ? Number(list.COST) : null,
//                 "Current Velocity": list.CURRENT_VELOCITY ? Number(list.CURRENT_VELOCITY) : null,
//                 "Stock": list.STOCK ? Number(list.STOCK) : null,
//                 "Min Price": list.MIN_PRICE ? Number(list.MIN_PRICE) : null,
//                 "Max Price": list.MAX_PRICE ? Number(list.MAX_PRICE) : null,
//                 "Current Price": list.CURRENT_PRICE ? Number(list.CURRENT_PRICE) : null,
//                 "Current Shipping": list.CURRENT_SHIPPING ? Number(list.CURRENT_SHIPPING) : null,
//                 "Current Fees": list.CURRENT_FEES ? Number(list.CURRENT_FEES) : null,
//                 "Manual Price": list.MANUAL_PRICE ? Number(list.MANUAL_PRICE) : null,
//                 "Original Price": list.ORIGINAL_PRICE ? Number(list.ORIGINAL_PRICE) : null,
//                 "Strategy ID": list.STRATEGY_ID,
//                 "BuyBox Price": list.BUYBOX_PRICE ? Number(list.BUYBOX_PRICE) : null,
//                 "BuyBox Seller": list.BUYBOX_SELLER ? list.BUYBOX_SELLER : '',
//                 "BuyBox Winner": list.BUYBOX_WINNER,
//                 "Seller ID": list.YOUR_SELLER_ID,
//                 "Comp Price": list.COMP_PRICE ? Number(list.COMP_PRICE) : null,
//                 "Comp Seller ID": list.COMP_SELLER_ID ? list.COMP_SELLER_ID : '',
//                 "Managed": list.MANAGED,
//                 "Sales Rank": list.SALES_RANK ? Number(list.SALES_RANK) : null,
//                 "Salse Rank Category": list.SALES_RANK_CATEGORY ? list.SALES_RANK_CATEGORY : '',
//                 "Date Added": list.DATE_ADDED,
//                 "Stock Cost Value": list.STOCK_COST_VALUE ? Number(list.STOCK_COST_VALUE) : null,
//                 "Date Last Sale": list.DATE_OF_LAST_SALE ? list.DATE_OF_LAST_SALE : null
//               });
//             }
//           } catch (error) {
//             console.error('Error fetching or converting CSV:', error);
//             throw error;
//           }
//         })
//       .catch(err => console.error(err));
//   })
//   .catch(err => console.error(err));



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
