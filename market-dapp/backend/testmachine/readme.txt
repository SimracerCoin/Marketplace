# Tudo feito dentro da directoria testmachines

# Criar inputs (já está não precisas de fazer)

echo "jA0ECQMCTK5jjrZOgnj20j8Bbd6Lt03v6DvZttqfWIG6gzGd/aCUw8qTwYdxkxqExiv0JwdvzoQp4M1TdkxNZxVOCJwR3qpJqduW4m8Zs2k=" > input

echo "12345Abc" > password

# Lançar cartesi playground (faz a partir daqui)

docker run -it --rm \
  -e USER=$(id -u -n) \
  -e GROUP=$(id -g -n) \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  -v `pwd`:/home/$(id -u -n) \
  -w /home/$(id -u -n) \
  cartesi/playground:0.3.0 /bin/bash

# A partir daqui é tudo dentro do playground!!!! 

mkdir ext2

cp decrypt.sh ext2

# Criar o filesystem com o script para usar na cartesi machine (sempre que alteras o script tens que apagar ext2 e voltar a gerar)

genext2fs -b 1024 -d ext2 decrypt.ext2 

# Truncar inputs e ficheiro de output para se poder usar na cartesi machine

truncate -s 4K input

truncate -s 4K password

truncate -s 4K output.raw

cartesi-machine \
  --flash-drive="label:decrypt,filename:decrypt.ext2" \
  --flash-drive="label:input,length:1<<12,filename:input" \
  --flash-drive="label:password,length:1<<12,filename:password" \
  --flash-drive="label:output,length:1<<12,filename:output.raw,shared" \
  -- $'cd /mnt/decrypt ; dd if=$(flashdrive input) of=input.raw ; dd if=$(flashdrive password) of=password.raw ; ./decrypt.sh input.raw password.raw > $(flashdrive output)'