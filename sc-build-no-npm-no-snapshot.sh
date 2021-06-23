npm run bundle:browser-record
dos2unix -q dist/record/* dist/replay/*
cp -f /home/statcounter/rrweb/dist/replay/rrweb-replay.js /home/statcounter/www/libs/rrweb/rrweb-replay.js
cp -f /home/statcounter/rrweb/dist/replay/rrweb-replay.min.js /home/statcounter/www/libs/rrweb/rrweb-replay.min.js
sed -i "/sourceMappingURL/d" --  /home/statcounter/www/libs/rrweb/rrweb-replay.min.js

if ! [[ -n $(diff /home/statcounter/rrweb/dist/record/rrweb-record.js /home/statcounter/www/libs/rrweb/rrweb-record.js) ]]; then
  # don't take next actions if only replay stuff has changed
   exit 0
fi

cp -f /home/statcounter/rrweb/dist/record/rrweb-record.js /home/statcounter/www/libs/rrweb/rrweb-record.js
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.min.js /home/statcounter/www/libs/rrweb/rrweb-record.min.js
sed -i "/sourceMappingURL/d" --  /home/statcounter/www/libs/rrweb/rrweb-record.min.js
RRWEBV=`git rev-parse HEAD`
cd rrweb-snapshot
RRWEBSV=`git rev-parse HEAD`
cd - &> /dev/null
mkdir -p /home/statcounter/www/libs/rrweb/versioned
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.js "/home/statcounter/www/libs/rrweb/versioned/rrweb-record-$RRWEBV-$RRWEBSV.js"
cp -f /home/statcounter/rrweb/dist/record/rrweb-record.min.js "/home/statcounter/www/libs/rrweb/versioned/rrweb-record-$RRWEBV-$RRWEBSV.min.js"
sed -i "s|var rrweb_version = '.*';  // DEBUG|var rrweb_version = '$RRWEBV';  // DEBUG|g" -- /home/statcounter/www/counter/recorder_test_uncompressed.js
sed -i "s|var rrweb_snapshot_version = '.*';  // DEBUG|var rrweb_snapshot_version = '$RRWEBSV';  // DEBUG|g" -- /home/statcounter/www/counter/recorder_test_uncompressed.js
touch /home/statcounter/www/counter/recorder_test_uncompressed.js
cd ..
./pack_counter.py --rrweb
cd - &> /dev/null
