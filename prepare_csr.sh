#! /usr/bin/env bash
mkdir -p ./certs
for i in {1..10}
do
  openssl req -newkey rsa:4096 -nodes -subj "/CN=test-user-${i}" -keyout /dev/null -out "./certs/csr_user${i}.pem"
done
# sudo yum install wget -y
# wget https://github.com/grafana/k6/releases/download/v0.44.1/k6-v0.44.1-linux-amd64.tar.gz
# tar -xzvf k6-v0.44.1-linux-amd64.tar.gz -C ./
# mv k6-v0.44.1-linux-amd64/k6 ./