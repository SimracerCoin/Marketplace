#!/bin/bash

# general definitions
MACHINES_DIR=.
MACHINE_TEMP_DIR=__temp_machine
CARTESI_PLAYGROUND_DOCKER=cartesi/playground:0.3.0

# set machines directory to specified path if provided
if [ $1 ]; then
  MACHINES_DIR=$1
fi

# removes machine temp store directory if it exists
if [ -d "$MACHINE_TEMP_DIR" ]; then
  rm -r $MACHINE_TEMP_DIR
fi

# builds machine (running with 0 cycles)
# - initial (template) hash is printed on screen
# - machine is stored in temporary directory
docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER cartesi-machine \
    --max-mcycle=0 \
    --initial-hash \
    --store="$MACHINE_TEMP_DIR" \
    --flash-drive="label:decrypt,filename:decrypt.ext2" \
    --flash-drive="label:input,length:1<<12" \
    --flash-drive="label:password,length:1<<12" \
    --flash-drive="label:output,length:1<<12" \
    -- $'date -s \'2100-01-01\' && /mnt/decrypt/decrypt.sh'
    
MACHINE_TEMPLATE_HASH=$(docker run \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -h playground \
  -w /home/$(id -u -n) \
  --rm $CARTESI_PLAYGROUND_DOCKER cartesi-machine-stored-hash $MACHINE_TEMP_DIR/)

export MACHINE_TEMPLATE_HASH

# removes target machine directory if it exists
if [ -d "$MACHINES_DIR/$MACHINE_TEMPLATE_HASH" ]; then
  rm -r $MACHINES_DIR/$MACHINE_TEMPLATE_HASH
fi

# moves stored machine to a folder within $MACHINES_DIR named after the machine's hash
mv $MACHINE_TEMP_DIR $MACHINES_DIR/$MACHINE_TEMPLATE_HASH
