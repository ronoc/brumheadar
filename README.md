#::brumheadar 

Measure the performance of your NoSql Distributed Database.

![](http://www.realhd-audio.com/wp-content/uploads/2013/12/vu_meter.jpg)

Raison D'etre
---------------------

This tool can be used to determine the performance of your JSON based NOSQL database on a given platform.
A primary usecase of it would to compare and contrast the performance of a given databases (or databases) on different PaaS providers
with a view to choosing the right PaaS solution to host the intended highly load DB.

To analyse the metrics it uses statsD to output the timings of each operation.

Supported Databases:

* Elasticsearch

To Run
---------------------

These environment variables should be set.

    * DEBUG_LEVEL - //trace|info|warn|debug
    * STATSD_HOST
    * STATSD_PORT
    * ES_HOST
    * ES_PORT
    * SCHEMA_DIR

Most of those env vars should be self explanatory besides the SCHEMA_DIR

From ```/lib/common/config.js``` the ```SCHEMA_DIR``` should be local to the root of the repo. (as the app searches in ```process.cwd()/SCHEMA_DIR```)
for this directory structure

```
/
  elasticsearch/
    x_mappings.json
    y_mappings.json
    z_mappings.json
  weightings.json
 ```
 The weightings.json should be in this format, always adding up to 1 (or there or there abouts!)
 ```
 {
   x : 0.33,
   y : 0.33,
   z : 0.33
 }
 ```

In order to attempt to replicate real world scenarios please provide a compatible schema for each database that you want
The load testing will try to simulate traffic that reflects those weightings.

You should copy the schemata for each supported database to the relevant folder.
This Json should be the exact mappings that es autogenerates per type.

Installing elasticsearch locally may need the murmur3 plugin 
for MacOS running ES under brew this should be something like

```sudo /usr/local/Cellar/elasticsearch/2.3.2/libexec/bin/plugin install mapper-murmur3```







