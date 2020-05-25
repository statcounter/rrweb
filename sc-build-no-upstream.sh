cd rrweb-snapshot
npm run bundle && dos2unix dist/*
cd -
./sc-build-no-snapshot.sh
