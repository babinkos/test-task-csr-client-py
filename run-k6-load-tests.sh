#! /usr/bin/env bash
# docker run --rm -i -v ./certs:/certs:ro grafana/k6 run - <k6-script.js
k6 run k6-script.js