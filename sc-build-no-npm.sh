cd packages/rrweb-snapshot
yarn bundle:es-only && dos2unix dist/*
cd -
./sc-build-no-npm-no-snapshot.sh
