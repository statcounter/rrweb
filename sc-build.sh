cd rrweb-snapshot
npm run bundle && dos2unix dist/*
cd -
npm run bundle:browser-record && dos2unix dist/record/* dist/*
cp -f /home/statcounter/rrweb/dist/rrweb.js /home/statcounter/www/js/rrweb/rrweb.js
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.js /home/statcounter/www/js/rrweb/rrweb-record.js
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.min.js /home/statcounter/www/js/rrweb/rrweb-record.min.js
