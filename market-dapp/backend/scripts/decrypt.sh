#!/bin/bash
#
# sample: /decrypt.sh "jA0ECQMCTK5jjrZOgnj20j8Bbd6Lt03v6DvZttqfWIG6gzGd/aCUw8qTwYdxkxqExiv0JwdvzoQp4M1TdkxNZxVOCJwR3qpJqduW4m8Zs2k=" 12345Abc
# dependency: https://www.cyberciti.biz/tips/linux-how-to-encrypt-and-decrypt-files-with-a-password.html
#
ENCODED_FILE=$1
PASSWORD=$2
# check if command exists and fail otherwise
command -v "gpg" >/dev/null 2>&1
if [[ $? -ne 0 ]]; then
    echo "I require GPG but it's not installed. Abort."
    exit 1
fi
FILE=`echo -n $ENCODED_FILE | base64 --decode`          #decode file
tmpfile_in=$(mktemp decrypt-script.XXXXXX.gpg)          #create temp file to store encrypted file
tmpfile_out=${tmpfile_in/".gpg"/""}
echo "$FILE" >> "$tmpfile_in"
gpg --batch --passphrase "$PASSWORD" -o "$tmpfile_out" -d "$tmpfile_in" 2>/dev/null #decrypt file
# check if decrypt went well
if [[ ! -f "$tmpfile_out" ]]; then
    rm "$tmpfile_in" 
    echo "decryption error"
    exit 1
fi
cat "$tmpfile_out"  #script output decrypted file
#remove tmp file
rm "$tmpfile_in" 
rm "$tmpfile_out"