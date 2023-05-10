# test-task-csr-client-py

## Environment preparation

Run script prepare_csr.sh to create csr files

Install K6, see https://k6.io/docs/get-started/installation/

To verify cert signing solution works you can use one of commands:
```
curl -v 'http://geotest.babinkos.de/health'
curl -v 'http://eu-failover-primary.babinkos.de/health'
curl -v 'http://us-failover-primary.babinkos.de/health'
```

Simple test wich will report missing csr:
`curl -v -X PUT -H "Content-Type: application/json" 'https://eu-failover-primary.babinkos.de/cert/sign' -d '{"name":"test2","csr":"none"}'`

Test to sign real csr:
`curl -v -X PUT -H "Content-Type: application/json" 'https://geotest.babinkos.de/cert/sign' -d @test-curl-data.json`

To test locally running app or docker container run this way (it will send a fail message as result):
`curl -v -X PUT -H "Content-Type: application/json" 'http://127.0.0.1:8080/cert/sign' -d '{"name":"test2","csr":"none"}'`

## Running load test

Run script run-k6-load-tests.sh or any of commands below:
- `k6 run k6-script.js`
- `docker run --rm -i -v ./certs:/certs:ro grafana/k6 run - <k6-script.js`


Single container works well with up to 2-4 requests per second, processing time is 250ms-2s usually. Under heavier load failed connection appears and request duration degrades significantly.