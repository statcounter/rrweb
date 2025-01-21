
cd packages/replay
yarn build
dos2unix -q dist/replay/*
cd - &> /dev/null

cp -f /home/statcounter/rrweb/packages/replay/dist/replay.umd.cjs /home/statcounter/www/libs/rrweb/rrweb-replay.js
cp -f /home/statcounter/rrweb/packages/replay/dist/replay.umd.min.cjs /home/statcounter/www/libs/rrweb/rrweb-replay.min.js

sed -e '/\(dropped\|ignored\).*\[/,/\]/!d' /home/statcounter/recorder/member-websocket.py | sed 's|EventType|rrweb.EventType|g' | sed 's|IncrementalSource|rrweb.IncrementalSource|g' | sed 's|__add__|concat|g' >> /home/statcounter/www/libs/rrweb/rrweb-replay.js
sed -e '/\(dropped\|ignored\).*\[/,/\]/!d' /home/statcounter/recorder/member-websocket.py | sed 's|EventType|rrweb.EventType|g' | sed 's|IncrementalSource|rrweb.IncrementalSource|g' | sed 's|__add__|concat|g' >> /home/statcounter/www/libs/rrweb/rrweb-replay.min.js
sed -i "/^\/\/# sourceMappingURL/d" --  /home/statcounter/www/libs/rrweb/rrweb-replay.min.js
