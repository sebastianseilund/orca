# orca

TODO:

- Improve readme
- Make instructions about docker registry be variable
- Interface:
    - `orca watch --marathon http://192.168.22.11 app-1 app2:/path/to/app2`
    - `orca watch -c config.yml`
    - `orca config set marathon`
    - Maybe we should only support the config file format? Would be simpler.


## Config example:

```yaml
marathon: http://192.168.22.11
registry: 192.168.22.11:5000
apps:
- app-1
- name: app-2
  dir: /path/to/my/app-2
- name: app-3
  dir: ./relative-path-to-app-2
```

## Usage

Prerequisites:

- Docker and Docker Machine (just use Docker Toolbox)

TODO: Check first if there are other insecure registries
TODO: Can we make a recipe for updating the existing one instead of nuking it?
You must configure your docker-machine to accept the insecure registry inside Mesos:

```
# WARNING: This will delete all your current images. If you want to keep them you need to use different names than `default`
docker-machine stop default
docker-machine rm default
docker-machine create --driver virtualbox --engine-insecure-registry 192.168.23.11:5000 default
eval "$(docker-machine env default)"
```
