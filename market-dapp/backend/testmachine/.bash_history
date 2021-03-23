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
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
truncate -s 4K output.raw
truncate -s 4K output.raw
quit
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
truncate -s 4K output.raw
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
cartesi-machine --flash-drive="label:decrypt,filename:decrypt.ext2" --flash-drive="label:input,length:1<<12,filename:input" --flash-drive="label:password,length:1<<12,filename:password" --flash-drive="label:output,length:1<<12,filename:output.raw,shared" -- $'cd /mnt/decrypt; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'
ls -l
cartesi-machine --flash-drive="label:decrypt,filename:decrypt.ext2" --flash-drive="label:input,length:1<<12,filename:input" --flash-drive="label:password,length:1<<12,filename:password" --flash-drive="label:output,length:1<<12,filename:output.raw,shared" -- $'cd /mnt/decrypt; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ls -l;  ./decrypt.sh input.raw password.raw > $(flashdrive output)'
ls -l
ls -l
rm -rf ext2
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine --flash-drive="label:decrypt,filename:decrypt.ext2" --flash-drive="label:input,length:1<<12,filename:input" --flash-drive="label:password,length:1<<12,filename:password" --flash-drive="label:output,length:1<<12,filename:output.raw,shared" -- $'cd /mnt/decrypt; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ls -l;  ./decrypt.sh input.raw password.raw > $(flashdrive output)'
rm -rf ext2
mkdir ext2
cp decrypt.sh ext2
cartesi-machine --flash-drive="label:decrypt,filename:decrypt.ext2" --flash-drive="label:input,length:1<<12,filename:input" --flash-drive="label:password,length:1<<12,filename:password" --flash-drive="label:output,length:1<<12,filename:output.raw,shared" -- $'/mnt/decrypt/decrypt.sh input.raw password.raw > $(flashdrive output)'
rm -rf ext2
mkdir ext2
cp decrypt.sh ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine --flash-drive="label:decrypt,filename:decrypt.ext2" --flash-drive="label:input,length:1<<12,filename:input" --flash-drive="label:password,length:1<<12,filename:password" --flash-drive="label:output,length:1<<12,filename:output.raw,shared" -- $'/mnt/decrypt/decrypt.sh input.raw password.raw > $(flashdrive output)'
rm -rf ext2
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
genext2fs -b 1024 -d ext2 decrypt.ext2
genext2fs -b 1024 -d ext2 decrypt.ext2
exit
wget
wget https://ipfs.infura.io/ipfs/QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf
lua
lua -e
truncate -s 4k QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared" \
echo "1q" > password
truncate -s 4K password
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared" \
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; ./decrypt.sh > $(flashdrive output)'
rm -rf ext2/
mkdir ext2/
cp decrypt.sh ext2/
genext2fs -b 1024 -d ext2 decrypt.ext2
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; ./decrypt.sh > $(flashdrive output)'
truncate -s 4K output.raw
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'cd /mnt/decrypt ; ./decrypt.sh > $(flashdrive output)'
io.write() ;
io.write((string.unpack(">c117",  io.read("a"))))
dd status=none if=$(flashdrive input) | lua -e 'io.write((string.unpack(">c117",  io.read("a"))))'
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
exit
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:input"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
wget https://ipfs.infura.io/ipfs/QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf
tuncate -s 4k QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf 
truncate -s 4k QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf 
> output.raw 
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
exit
mkdir ext2
cp decrypt.sh ext2
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
xxd -b QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf | cut -d" " -f 2-7 | tr "\n" " "
cat QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf | xxd -p
cat QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf | xxd -p -u
cat QmZR234xmH6DiS11WXeQ9nC1nSXd7Z1D578imGTpXqzYDf | od -A n -t x1
wget https://ipfs.infura.io/ipfs/QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk
truncate -s 4k QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk 
cat QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk | xxd -p
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
truncate -s 4k password
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
truncate -s 4k password
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
truncate -s 4k output.raw 
mkdir ext2
cp decrypt.sh ext2
truncate -s 4k output.raw 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
mkdir ext2
cp decrypt.sh ext2
genext2fs -b 1024 -d ext2 decrypt.ext2 
cartesi-machine   --flash-drive="label:decrypt,filename:decrypt.ext2"   --flash-drive="label:input,length:1<<12,filename:QmfM8ipwA8Ja2PmJwzLSdGdYRYtZmRMQB8TDZrgM1wYWBk"   --flash-drive="label:password,length:1<<12,filename:password"   --flash-drive="label:output,length:1<<12,filename:output.raw,shared"   -- $'/mnt/decrypt/decrypt.sh'
exit
