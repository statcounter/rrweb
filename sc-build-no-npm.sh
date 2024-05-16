cd packages/types
yarn prepublish
cd -
cd packages/rrweb-snapshot
yarn bundle:es-only
cd -
./sc-build-no-npm-no-snapshot.sh
