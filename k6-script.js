import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// curl -v -X PUT -H "Content-Type: application/json" 'http://127.0.0.1:8000/cert/sign' -d '{"name":"test1","csr":"none"}'
const url0 = 'http://127.0.0.1:8080/health';
const url = 'http://127.0.0.1:8080/cert/sign';
const binFiles = new SharedArray('csrs', function () {
  // here you can open files, and then do additional processing or generate the array with data dynamically
  var csrStart = 1;
  var csrEnd = 10;
  var arr = [];
  for (var i = csrStart; i < csrEnd + 1; i++) {
    const f = open('certs/csr_user' + i + '.pem', 'text');
    arr.push(f);
  }
  return arr; // f must be an array[]
});

const payloads = new SharedArray('datajsons', function () {
  // here you can open files, and then do additional processing or generate the array with data dynamically
  var csrStart = 1;
  var csrEnd = 10;
  var arr = [];
  for (var i = csrStart; i < csrEnd + 1; i++) {
    const f = JSON.stringify({
      name: 'test' + i + '-' + uuidv4(),
      csr: binFiles[i - 1],
    });
    arr.push(f);
  }
  return arr; // f must be an array[]
});

const reqList = new SharedArray('requestjsons', function () {
  // here you can open files, and then do additional processing or generate the array with data dynamically
  var csrStart = 1;
  var csrEnd = 10;
  var arr = [];
  for (var i = csrStart; i < csrEnd + 1; i++) {
    const f = {
      method: 'PUT',
      url: url,
      body: { "name": "test"+i+"-" + uuidv4(), "csr": binFiles[i - 1] },
      params: {
        headers: { 'Content-Type': 'application/json' },
      },
    };
    arr.push(f);
  }
  return arr; // f must be an array[]
});


// ramp-up stages
// export const options = {
//   stages: [
//     { duration: '5m', target: 20 },
//     { duration: '5m', target: 30 },
//     { duration: '5m', target: 40 },
//   ],
// };

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
  scenarios: {
    my_scenario1: {
      executor: 'constant-arrival-rate',
      duration: '10s', // total duration
      preAllocatedVUs: 210, // to allocate runtime resources     preAll

      rate: 200, // number of constant iterations given `timeUnit`
      timeUnit: '1s',
    },
  },
};

export default function () {
  const req0 = {
    method: 'GET',
    url: url0,
  };
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  console.log("executed :");
  const i = Math.round(Math.random() * 9);

  console.log(JSON.parse(payloads[i]).name);
  // http.get(url0);
  const res = http.put(url, payloads[i], params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  console.log("node: "+JSON.parse(res.body).node);
  // sleep(Math.random() * 2);
}

