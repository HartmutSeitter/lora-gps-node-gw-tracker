const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const Datastore = require('nedb');

const database = new Datastore('database.db');
database.loadDatabase();

require('dotenv').config({ path: './myconfig.env' })

mqtt_username =process.env.mqtt_username;
mqtt_password = process.env.mqtt_password;
port = process.env.port;
no_of_db_records = process.env.no_of_db_records;
mqtt_topic = process.env.mqtt_topic;
  
console.log("mqtt_username:", mqtt_username);
console.log("mqtt_password:", mqtt_password);
console.log("no_of_db_records:",no_of_db_records);
console.log("port:",port);
console.log("mqtt_topic", mqtt_topic);

var mqtt = require('mqtt');
var Topic =mqtt_topic;
var client  = mqtt.connect('mqtt://eu1.cloud.thethings.network:1883',
  {  username: mqtt_username,
     password: mqtt_password
  });
 
client.on('connect', mqtt_connect);
client.on('reconnect', mqtt_reconnect);
client.on('error', mqtt_error);
client.on('message', mqtt_messsageReceived);
client.on('close', mqtt_close);

function mqtt_connect()
{
    console.log("connecte MQTT");
    client.subscribe(Topic, mqtt_subscribe);
}

function mqtt_subscribe(err, granted)
{
    console.log("Subscribed to " + Topic);
    if (err) {console.log(err);}
}

function mqtt_reconnect(err)
{
    console.log("Reconnect MQTT");
    if (err) {console.log(err);}
    //client  = mqtt.connect('mqtt://localhost:1883');
	
}

function mqtt_error(err)
{
  console.log("Error!");
	if (err) {console.log(err);}
}

function after_publish()
{
	//do nothing
}

function mqtt_messsageReceived(topic, message, packet)
{
    //
    // here you get the data from the sensor    //
    //   do the necessary checks and save the data into the mongo database
	//console.log('Topic=' +  topic + '  Message=' + message);
  var msg= JSON.parse(message)
  
  //console.log(' ');
  //console.log('number of gateway = ', msg.uplink_message.rx_metadata.length);
  // get the timestamp when the message was received
  // I will save all the data in influx using this timestamp, however I have to convert it in unixtime format in nano sec
  // this the rec_time format 2022-12-19T13:52:08.973043499Z
  const rec_time =  msg.received_at;
  //console.log('rec_time',rec_time);

  const [dateComponents, timeComponents] = rec_time.split('T'); // 👉️ "2022-12-19" 👉️ "13:52:08.973043499Z"
  const [year, month, day] = dateComponents.split('-');  //👉️ "2022" "12" "19"
  const [hours, minutes, seconds] = timeComponents.split(':'); //👉️ "13" "52" "08.973043499Z"
  var sec= seconds.substring(0,seconds.length - 1);  // "08.973043499"
  const [sec1, msec] = sec.split('.'); // "973043499"
  var rec_unixtime = new Date(rec_time).valueOf();
  const date = new Date(+year, month - 1, +day, +hours + 1, +minutes, +sec); // new date format 2022 12 19 ....
  var unixTimestamp = Math.floor(date.getTime())* 1000000+parseInt(msec);  // get.time returns timestamp without msec, so multiplay it with 1000000 (for nsec) add the nsec
  //console.log("unix time = ", unixTimestamp);

  const device_id =  msg.end_device_ids.device_id;
  const app_id =  msg.end_device_ids.application_ids.application_id;
  //console.log('device_id', device_id);
  //console.log('app_id', app_id);

  var node_alt = 0;
  var node_lon = 0;
  var node_lat = 0;
  if (msg.uplink_message.hasOwnProperty('decoded_payload')) {
    if (msg.uplink_message.decoded_payload.hasOwnProperty('altitude'))
      node_alt =  msg.uplink_message.decoded_payload.altitude;
    if (msg.uplink_message.decoded_payload.hasOwnProperty('longitude'))
      node_lon =   msg.uplink_message.decoded_payload.longitude;
    if (msg.uplink_message.decoded_payload.hasOwnProperty('latitude'))
      node_lat =   msg.uplink_message.decoded_payload.latitude;
  }
  bandwidth=  msg.uplink_message.settings.data_rate.lora.bandwidth;
  spreding_factor =  msg.uplink_message.settings.data_rate.lora.spreading_factor;
  coding_rate =  msg.uplink_message.settings.data_rate.lora.coding_rate.toString();
  frequency = msg.uplink_message.settings.frequency;


  database.insert(msg);

  /*
  writeApi.close().then(() => {
    console.log('WRITE FINISHED')
  })
  */
}

function mqtt_close(err)
{
	console.log("Close MQTT");
    if (err) {console.log(err);}
}

//**************************************************************************** */
// handle get request
//**************************************************************************** */
app.get('/', async(req,res)=>{
    // 001hs - when a get request is received send all data / post back to client
    console.log("http get request received = ",req);
    res.sendFile(path.join(__dirname+'/index2.html'));
});
//**************************************************************************** */
// handle get/gpsdata request
//**************************************************************************** */
app.get('/gpsdata', (req,res)=>{
    // read data from influx and send it back to client
    console.log("http get gpsdata request received");
    node_res = [];
    // get the node_data
    
    /** Execute a query and receive line table metadata and rows. */
    //queryApi.queryRows(influxquery, fluxObserver);
      
    // database.count({}, function(err, count) {
    //   if (err)
    //     console.log("err = ", err );
    //   else
    //     console.log('number of docs = ', count);
    // });

    // database.find({}, (err, data) => {
    //   if (err) {
    //     response.end();
    //     return;
    //   }
    //   //console.log('data = ' , data.slice(-2));
      
    
    database
        .find({ })
        //.sort({ updatedAt: -5 }) // to sort by last modification time
        .limit(800)
        .exec(function(err, docs) {
          console.log("data to client = ", docs);
          res.json(docs);
        });
  });

app.listen(port, console.log('App Listening to port' + port.toString()));