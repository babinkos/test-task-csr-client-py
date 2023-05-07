import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// curl -v -X PUT -H "Content-Type: application/json" 'http://127.0.0.1:8000/cert/sign' -d '{"name":"test1","csr":"none"}'
const urlHealthz = 'http://127.0.0.1:8080/healthz';
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

// const payloads = new SharedArray('datajsons', function () {
//   // here you can open files, and then do additional processing or generate the array with data dynamically
//   var csrStart = 1;
//   var csrEnd = 10;
//   var arr = [];
//   for (var i = csrStart; i < csrEnd + 1; i++) {
//     const f = JSON.stringify({
//       name: 'test' + i + '-' + uuidv4(),
//       csr: binFiles[i - 1],
//     });
//     arr.push(f);
//   }
//   return arr; // f must be an array[]
// });

const reqList = new SharedArray('requestjsons', function () {
  // here you can open files, and then do additional processing or generate the array with data dynamically
  var csrStart = 1;
  var csrEnd = 10;
  var arr = [];
  for (var i = csrStart; i < csrEnd + 1; i++) {
    const f = {
      method: 'PUT',
      url: url,
      body: JSON.stringify({
        "name": "test" + i + "-" + uuidv4(),
        "csr": binFiles[i - 1]
      }),
      params: {
        headers: { 'Content-Type': 'application/json' },
        // tags: { name: 'CertSign' },
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
    http_req_duration: ['p(95)<250'], // 95% of requests should be below 21s
  },
  discardResponseBodies: true,
  scenarios: {
    my_scenario1: {
      executor: 'constant-arrival-rate',
      duration: '10m', // total duration
      preAllocatedVUs: 400, // to allocate runtime resources     preAll
      // number of constant iterations given `timeUnit` :
      rate: 20, // gives 70-85 CPU load without failed requests, 200-210ms sign request duration
      timeUnit: '10s',
    },
    my_scenario2: {
      executor: 'ramping-arrival-rate',
      startTime: '1m', //start after 1m - next after first scenario
      // Start at 300 iterations per `timeUnit`
      startRate: 20,
      // Start `startRate` iterations per minute
      timeUnit: '10s',
      // Pre-allocate necessary VUs.
      preAllocatedVUs: 200,
      stages: [
        { target: 22, duration: '30s' },
        { target: 25, duration: '30s' }, // 70-76 
        { target: 28, duration: '30s' }, // 77-86
        // Start 300 iterations per `timeUnit` for the first minute.
        { target: 30, duration: '30s' }, // 84-86
        // Linearly ramp-up to starting 600 iterations per `timeUnit` over the following two minutes.
        { target: 32, duration: '30s' }, // 92-96% 1vCPU  32MB
        // Continue starting 600 iterations per `timeUnit` for the following four minutes.
        // { target: 35, duration: '30s' }, // 95-98, slow >2s req duration
        // // Linearly ramp-down to starting 60 iterations per `timeUnit` over the last two minute.
        // { target: 38, duration: '30s' },
        // { target: 40, duration: '30s' },
      ],
    },
  },
};

export default function () {
  // const req0 = {
  //   method: 'GET',
  //   url: url0,
  // };
  // const params = {
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // };
  // console.log("executed :");
  // const i = Math.round(Math.random() * 9);

  // console.log(JSON.parse(payloads[i]).name);
  // const res = http.put(url, payloads[i], params);

  // const res = http.get(urlHealthz, {
  //   tags: { name: 'Healthz' },
  // });
  // check(res, { 'healthz status was 204': (r) => r.status == 204 });

  const responses = http.batch([reqList[0], reqList[1], reqList[2],
  reqList[3], reqList[4], reqList[5], reqList[6], reqList[7],
  reqList[8], reqList[9]]);
  // var resStart = 0;
  // var resEnd = 1;
  // var arr = [];
  // for (var i = resStart; i < resEnd + 1; i++) {
  check(responses[0], { 'status was 200': (r) => r.status == 200 });
  check(responses[1], { 'status was 200': (r) => r.status == 200 });
  check(responses[2], { 'status was 200': (r) => r.status == 200 });
  check(responses[3], { 'status was 200': (r) => r.status == 200 });
  check(responses[4], { 'status was 200': (r) => r.status == 200 });
  check(responses[5], { 'status was 200': (r) => r.status == 200 });
  check(responses[6], { 'status was 200': (r) => r.status == 200 });
  check(responses[7], { 'status was 200': (r) => r.status == 200 });
  check(responses[8], { 'status was 200': (r) => r.status == 200 });
  check(responses[9], { 'status was 200': (r) => r.status == 200 });
  // };
  // console.log("batch result: ");
  // console.log(responses[0].body);
  // sleep(Math.random() * 1); // The arrival-rate executors already pace the iteration rate through the rate and timeUnit properties. It's unnecessary to use a sleep() function at the end of the VU code. 
}

