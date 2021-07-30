cd packages/rrweb
yarn bundle
dos2unix -q dist/record/* dist/replay/*
cd - &> /dev/null

cp -f /home/statcounter/rrweb/packages/rrweb/dist/replay/rrweb-replay.js /home/statcounter/www/libs/rrweb/rrweb-replay.js
cp -f /home/statcounter/rrweb/packages/rrweb/dist/replay/rrweb-replay.min.js /home/statcounter/www/libs/rrweb/rrweb-replay.min.js
sed -i "/sourceMappingURL/d" --  /home/statcounter/www/libs/rrweb/rrweb-replay.min.js

if ! [[ -n $(diff /home/statcounter/rrweb/packages/rrweb/dist/record/rrweb-record.js /home/statcounter/www/libs/rrweb/rrweb-record.js) ]]; then
  # don't take next actions if only replay stuff has changed
   exit 0
fi

cp -f /home/statcounter/rrweb/packages/rrweb/dist/record/rrweb-record.js /home/statcounter/www/libs/rrweb/rrweb-record.js
cp -f /home/statcounter/rrweb/packages/rrweb/dist/record/rrweb-record.min.js /home/statcounter/www/libs/rrweb/rrweb-record.min.js
sed -i "/sourceMappingURL/d" --  /home/statcounter/www/libs/rrweb/rrweb-record.min.js
RRWEBV=`git rev-parse HEAD`
mkdir -p /home/statcounter/www/libs/rrweb/versioned
cp -f /home/statcounter/rrweb/packages/rrweb/dist/record/rrweb-record.js "/home/statcounter/www/libs/rrweb/versioned/rrweb-record-$RRWEBV.js"
cp -f /home/statcounter/rrweb/packages/rrweb/dist/record/rrweb-record.min.js "/home/statcounter/www/libs/rrweb/versioned/rrweb-record-$RRWEBV.min.js"
sed -i "s|var rrweb_version = '.*';  // DEBUG|var rrweb_version = '$RRWEBV';  // DEBUG|g" -- /home/statcounter/www/counter/recorder_test_uncompressed.js
touch /home/statcounter/www/counter/recorder_test_uncompressed.js
cd ..
./pack_counter.py --rrweb
cd - &> /dev/null
