import http from 'k6/http';
import { check, sleep } from 'k6';

const base_url = 'http://proxy:8080';

export const options = {
  stages: [
    { duration: '2m', target: 5 },
    { duration: '10m', target: 5 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const paths = [
    "/go/jpeg",
    "/nodejs/jpeg",
    "/wasm/go",
    "/wasm/rust",
  ]

  paths.forEach((path) => {
    const res = http.get(base_url + path);
    const success = check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(1); // seconds
  })

}
