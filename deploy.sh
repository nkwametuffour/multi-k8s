#!/bin/sh

docker build -t nkwametuffour/fib-multi-client:latest -t nkwametuffour/fib-multi-client:$SHA -f client/Dockerfile client/
docker build -t nkwametuffour/fib-multi-server:latest -t nkwametuffour/fib-multi-server:$SHA -f server/Dockerfile server/
docker build -t nkwametuffour/fib-multi-worker:latest -t nkwametuffour/fib-multi-worker:$SHA -f worker/Dockerfile worker/

docker push nkwametuffour/fib-multi-client:latest
docker push nkwametuffour/fib-multi-client:$SHA
docker push nkwametuffour/fib-multi-server:latest
docker push nkwametuffour/fib-multi-server:$SHA
docker push nkwametuffour/fib-multi-worker:latest
docker push nkwametuffour/fib-multi-worker:$SHA

kubectl apply -f k8s/

# Update client, server and worker image versions imperatively
kubectl set image deployments/client-deployment client=nkwametuffour/fib-multi-client:$SHA
kubectl set image deployments/server-deployment server=nkwametuffour/fib-multi-server:$SHA
kubectl set image deployments/worker-deployment worker=nkwametuffour/fib-multi-worker:$SHA