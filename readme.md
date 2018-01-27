# ethminer influx exporter

# Install
```bash
git clone https://github.com/cgarnier/ethminer-influx.git
npm i
```
# Usage

```bash
TIMER=1000 \
ETHMINER_PORT=3000 \
ETHMINER_HOST=192.168.1.23 \
DEBUG=true \
INFLUX_HOST=influx.exemple.com \
HOSTNAME=rig1 \
npm start
```

# Docker usage

```bash
# Create a network between the miner and the reporter
docker network create miners

# Run the miner 
nvidia-docker run --rm \
  --name=miner1 \
  --network=miners \
  -d cgarnier/ethminer:cuda9.1 \
  -S eu1.ethermine.org:4444 \
  --api-port 3000 \ # Enable the api by setting a port
  -FS us1.ethermine.org:4444 \
  -O 0x27b0aac47a62d63e759c8271e0370cdc021843bf.rig_github
  
# Run the exporter
docker run \
  --network=miners
  -e TIMER=1000 \
  -e ETHMINER_PORT=3000 \
  -e ETHMINER_HOST=miner1 \
  -e DEBUG=true \
  -e INFLUX_HOST=influx.exemple.com \
  -e HOSTNAME=rig_github \
  -d cgarnier/ethminer-influx

```

# Metrics

This exporter export two metrics: node_stats and gpu_stats. Node_stats has a host tag, gpu_stats has host and gpu tag.
