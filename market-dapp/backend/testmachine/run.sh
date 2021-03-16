#!/bin/bash

# general definitions
FULL_PATH=$(dirname $(realpath $0))
DESCARTES_DIR=$(dirname $(dirname $FULL_PATH))
IPFS_PATH='/ipfs/QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf'
LOGGER_ROOT_HASH='f4f5eab8a077eae4529042060551991139d5cfdcddece7c0235235d2af94b390'

# set base descartes directory to specified path if provided
if [ $1 ]; then
  DESCARTES_DIR=$1
fi

# Build the cartesi machine 
. $FULL_PATH/src/build-cartesi-machine.sh $DESCARTES_DIR/machines

export IPFS_PATH
export LOGGER_ROOT_HASH

# Instantiate descartes and start the process
npx hardhat run $FULL_PATH/instantiate.ts --no-compile --network localhost