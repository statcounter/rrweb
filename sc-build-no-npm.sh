cd packages/rrweb-snapshot
yarn bundle && dos2unix dist/*.js
cd -
./sc-build-no-npm-no-snapshot.sh
