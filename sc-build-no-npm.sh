cd packages/rrweb-snapshot
yarn bundle && dos2unix dist/*
cd -
./sc-build-no-npm-no-snapshot.sh
