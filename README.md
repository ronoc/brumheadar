#::brumheadar 

Measure the performance of your NoSql Distributed Database.

![](http://www.realhd-audio.com/wp-content/uploads/2013/12/vu_meter.jpg)

##::Introduction
This tool can be used to determine the performance of your JSON based NOSQL database on a given platform.
It was built to compare and contrast different PaaS providers with a view to choosing the right PaaS solution for a highly scalable cloud application.

The tool uses statsD to output the timings of the various operations. 

Currently performance analysis is supported on elasticsearch.
Schemas should be added to the appropriate folder for each DB in the "schemata" folder. 


# TODO
Make default schemas per supported database that can be used in the event that the user cannot provide or will not provide their own. 
