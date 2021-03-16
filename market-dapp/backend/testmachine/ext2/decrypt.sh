#!/bin/sh

dd status=none if=$(flashdrive input) | lua -e 'io.write((string.unpack("z",  io.read("a"))))' > document
dd status=none if=$(flashdrive password) | lua -e 'print((string.unpack("z",  io.read("a"))))' > password

pass=$(cat password)             #read string for binary file
tmpfile_out=$(mktemp -u)         #create temp file to store decrypted file

gpg -d --batch --passphrase "$password" -o $tmpfile_out document  #try to decrypt document

# check if decrypt went well
[ ! -s $tmpfile_out ] && { echo "decryption error"; exit 99; }

cat $tmpfile_out  #script output decrypted file