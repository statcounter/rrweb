npm run bundle:browser-record
dos2unix -q dist/record/* dist/replay/*
cp -f /home/statcounter/rrweb/dist/replay/rrweb-replay.js /home/statcounter/www/libs/rrweb/rrweb-replay.js
cp -f /home/statcounter/rrweb/dist/replay/rrweb-replay.min.js /home/statcounter/www/libs/rrweb/rrweb-replay.min.js
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.js /home/statcounter/www/libs/rrweb/rrweb-record.js
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.min.js /home/statcounter/www/libs/rrweb/rrweb-record.min.js
