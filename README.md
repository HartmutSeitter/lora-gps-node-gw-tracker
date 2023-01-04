# lora-gps-node-gw-tracker
Node.js program to track gps coordinates of a lora node and corresponding gw

remark - the config to run the program is specified in myconfi.env which has to setup accoringly

a small node.js program which connect to the TTN server via mqtt and get the TTN messages form a TTN application and the corresponding gateways.

This message will be saved in a database

The node.js will serve a webpage (index.html) which shows the gps coordinates in openstreet map
