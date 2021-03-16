#!/bin/bash

# general definitions
FLASHDRIVE_BASE_DIR=.
FLASHDRIVE_PATH=dapp_data_0/flashdrive
CARTESI_IPFS_DOCKER=cartesi/ipfs-server:0.2.0


# set flashdrive base directory to specified path if provided
if [ $1 ]; then
  FLASHDRIVE_BASE_DIR=$1
fi

# set flashdrive path to specified path if provided
if [ $2 ]; then
  FLASHDRIVE_PATH=$2
fi


directValue="0x$(xxd -p input)"
echo -e "New directValue: $directValue"

truncate -s %4096 input


LOGGER_ROOT_HASH="$(docker run \
  --entrypoint "/opt/cartesi/bin/merkle-tree-hash" \
  -v `pwd`:/mount \
  --rm  $CARTESI_IPFS_DOCKER \
  --page-log2-size=3 --tree-log2-size=12  --input=/mount/input)"

mkdir -p $FLASHDRIVE_BASE_DIR/$FLASHDRIVE_PATH
cp input $FLASHDRIVE_BASE_DIR/$FLASHDRIVE_PATH/$LOGGER_ROOT_HASH


echo "New loggerRootHash: 0x$LOGGER_ROOT_HASH"
rm input

export LOGGER_ROOT_HASH