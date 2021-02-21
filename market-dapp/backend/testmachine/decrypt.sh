#
# sample: /decrypt.sh /path/to/encrypted_file /path/to/password_file 
#
ENCRYPTED_FILE=$1
PASSWORD_FILE=$2

[ ! -f $ENCRYPTED_FILE ] && { echo "$ENCRYPTED_FILE file not found"; exit 99; }
[ ! -f $PASSWORD_FILE ] && { echo "$PASSWORD_FILE file not found"; exit 99; }

password=$(tr -d '\0' <$PASSWORD_FILE)              #read string for binary file                 

tmpfile_out=$(mktemp -u)                            #create temp file to store decrypted file

gpg -d --batch --passphrase "$password" -o $tmpfile_out $ENCRYPTED_FILE  #decrypt file

# check if decrypt went well
[ ! -s $tmpfile_out ] && { echo "decryption error"; exit 99; }
cat $tmpfile_out  #script output decrypted file