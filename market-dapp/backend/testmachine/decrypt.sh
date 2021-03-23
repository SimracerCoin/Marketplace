#!/bin/sh

dd status=none if=$(flashdrive input) of=document                                                                 #read encrypted document

passphrase=$(dd status=none if=$(flashdrive password) | lua -e 'io.write((string.unpack("z",  io.read("a"))))')   #read password

# check if decrypt went well and return
result=$([ ! -z "`gpg -d --batch --passphrase "$passphrase" document 2>/dev/null`" ] && echo 1 || echo 0)

echo $result > $(flashdrive output)