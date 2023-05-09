import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { tagWithCurrentStageIndex } from 'https://jslib.k6.io/k6-utils/1.3.0/index.js';

// curl -v -X PUT -H "Content-Type: application/json" 'http://127.0.0.1:8000/cert/sign' -d '{"name":"test1","csr":"none"}'
const urlHealthz = 'http://127.0.0.1:8080/healthz';
const url = 'http://127.0.0.1:8080/cert/sign';
const maxUsers = 10;

const binFiles = new SharedArray('csrs', function () {
  // here you can open files, and then do additional processing or generate the array with data dynamically
  var csrStart = 1;
  var csrEnd = maxUsers;
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
  var csrEnd = maxUsers;
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

// const reqList = new SharedArray('requestjsons', function () {
//   // here you can open files, and then do additional processing or generate the array with data dynamically
//   var csrStart = 1;
//   var csrEnd = maxUsers;
//   var arr = [];
//   for (var i = csrStart; i < csrEnd + 1; i++) {
//     const f = {
//       method: 'PUT',
//       url: url,
//       body: JSON.stringify({
//         "name": "test" + i + "-" + uuidv4(),
//         "csr": binFiles[i - 1]
//       }),
//       params: {
//         headers: { 'Content-Type': 'application/json' },
//         // compression: 'gzip'
//         // tags: { name: 'CertSign' },
//       },
//     };
//     arr.push(f);
//   }
//   return arr; // f must be an array[]
// });

const scenario1_duration = '10s'
const scenario2_duration = '30s'
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<300'], // 95% of requests should be below 21s
  },
  discardResponseBodies: true,
  scenarios: {
    // my_scenario1: {
    //   executor: 'constant-arrival-rate', // to warm-up app
    //   duration: scenario1_duration, // total duration
    //   preAllocatedVUs: 2, // to allocate runtime resources     preAll
    //   // number of constant iterations given `timeUnit` :
    //   rate: 1, // gives 70-85 CPU load without failed requests, 200-210ms sign request duration
    //   timeUnit: '1s', // 10s
    // },
    my_scenario2: {
      executor: 'ramping-arrival-rate',
      // startTime: scenario1_duration, //start after 1m - next after first scenario
      // Start at 300 iterations per `timeUnit`
      startRate: 1,
      // Start `startRate` iterations per minute
      timeUnit: '1s',
      // Pre-allocate necessary VUs.
      preAllocatedVUs: 5,
      stages: [
        { target: 1, duration: scenario1_duration },
        { target: 1, duration: scenario2_duration },
        { target: 2, duration: scenario2_duration }, // 50% CPU load avg
        { target: 3, duration: scenario2_duration }, // 80% CPU avg
        // { target: 4, duration: scenario2_duration }, // 90% CPU and duration degrades >280ms
      ],
    },
  },
};

export default function () {
  // tagWithCurrentStageProfile();
  tagWithCurrentStageIndex();
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const i = Math.round(Math.random() * (maxUsers -1));

  const res = http.put(url, payloads[i], params);
  check(res, { 'status was 200': (r) => r.status == 200 });
  var duration = res.headers['X-Process-Time-Seconds']
  check(res, { 'X-Process-Time-Seconds < 2s': (r) => duration < 2 });
  if (duration > 2) {
    console.log("X-Process-Time-Seconds: " + duration)
  }
}

  // const responses = http.batch([reqList[0], reqList[1], reqList[2],
  // reqList[3], reqList[4], reqList[5], reqList[6], reqList[7],
  // reqList[8], reqList[9]]);
  // var resStart = 0;
  // var resEnd = 9;
  // var arr = [];
  // for (var i = resStart; i < resEnd + 1; i++) {
  //   check(responses[i], { 'status was 200': (r) => r.status == 200 });
  //   var duration = responses[i].headers['X-Process-Time-Seconds']
  //   check(responses[i], { 'X-Process-Time-Seconds < 1s': (r) => duration < 1 });
  //   if (duration > 1) {
  //     console.log("X-Process-Time-Seconds: " + duration)
  //   }
  // }
  // console.log("batch result: ");
  // console.log(responses[0].body);
  // sleep(Math.random() * 1); // The arrival-rate executors already pace the iteration rate through the rate and timeUnit properties. It's unnecessary to use a sleep() function at the end of the VU code. 
// }

