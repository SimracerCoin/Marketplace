ls
mkdir ext2
ls
cp decrypt.sh ext2/
genext2fs -b 1024 -d ext2 decrypt.ext2
ls
cat input 
truncate -s 8K input 
cat input 
truncate -s 4K password 
cat password 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
ls
rm input 
truncate -s 4K input
cat input 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
decode
base64
base64 --help
rm ext2/
rm -Rf ext2/
ls
rm decrypt.ext2 
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
rm ext2/
rm -Rf ext2/
mkdir ext2
ls
rm decrypt.ext2 
cp decrypt.sh ext2/
genext2fs -b 1024 -d ext2 decrypt.ext2
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
mktemp --help
ls
mkdir ext2
cp decrypt.sh ext2/
genext2fs -b 1024 -d ext2 decrypt.ext2 
s
ls
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
ls
touch output.raw
truncate -s 4K output.raw
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
ls
cat output.raw 
