cp decrypt.sh ext2
ls -l
cd market-dapp/
ls -l
cd backend/testmachine/
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh > $(flashdrive output)'
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh > $(flashdrive output)'
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
cd /mnt/
ls -l
exit
ls -l
exit
cd market-dapp/backend/testmachine/
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
cd /
cd ~
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
exit
