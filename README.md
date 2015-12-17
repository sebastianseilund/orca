# orca

TODO:

- Update babel
- Version
- Settle on a name. Or keep this one and put it in npm.

Orca n.:

> A black-and-white toothed whale (Orcinus orca) that feeds on large fish, squid, and marine mammals such as seals and other whales and dolphins. Also called **killer whale**.

Orca replaces (kills) [Docker](https://www.docker.com/) containers running in [Marathon](http://mesosphere.github.io/marathon/). Docker's logo is a whale. Killer :whale:. Orca.

You run the `orca` command on your own host machine. It monitors changes to your source files. When they change:

- A new Docker image is built.
- The image is pushed to a private Docker Registry.
- A Marathon app is updated to run the new image.

Orca is intended to be used in development on your own local machine. It solves the problem of working on source code and having to rebuild images and restart services by hand. With Orca it happens relatively fast. A few seconds is all it should take with well-optimized Dockerfiles (except for the very first build, which will warm Docker's build cache).


## Installation

Not yet available on npm. Install it manually using `npm link`:

```
git clone https://github.com/sebastianseilund/orca.git
cd orca
npm install
npm link
```


## Environment requirements

The `docker` command must be available in your PATH on your own machine.

You must use Marathon to run your app. Your own machine needs access to the Marathon master's HTTP endpoint. Marathon can run on your own machine, in a VM, or remotely on a different machine.

You must have access to a private Docker Registry, which your Mesos slaves also have access to pull images from.


## Command line usage

To start Orca you run it from your terminal like this:

```sh
orca <config-file>
```

`<config-file>` should be the path to your orca config file (see next section). Example:

```sh
orca path/to/orca.yml
```

All configured apps will be built, pushed and updated upon running this command. When a file for a specific app changes later, only that app will be updated again.

The command will stay running as long as you want. If you edit your config file you must restart it yourself (press Ctrl+C and run it again).

Orca will output what it's doing. If you want it to stream output from the Docker build and push commands, you can run it with the `-v` flag:

```sh
orca orca.yml -v
```


## Config file

The config file is a YAML file with the following keys:

- `marathon`: The Marathon master endpoint. Example: `http://192.168.123.123:8080`
- `registry`: The docker registry host and port. Example: `192.168.123.123:5000`
- `apps`: An array of apps to monitor. Each element can have the following attributes:
    - `name`: The name of the app in Marathon.
    - `dir`: Path to the directory that contains the relevant Dockerfile. This can either be an absolute path or be relative to the config file itself. Defaults to the same value of `name`.
    - `glob`: An array of glob patterns to monitor for file changes inside `dir`. Defaults to an array with a single element `**/*` (i.e. all files are monitored).

If an element in `apps` is a string it will be regarded the same as an object with that string value in both `name` and `dir`. This means:

```yaml
- my-app
# Is equivalent to:
- name: my-app
  dir: my-app
```

Full example:

```yaml
marathon: http://192.168.123.123:8080
registry: 192.168.22.11:5000
apps:
- app-1
- name: app-2
  dir: /path/to/my/app-2
- name: app-3
  dir: ./relative-path-to-app-2
- name: app-4
  glob:
  - **/*.js
  - **/*.css
  - **/*.html
```


## Troubleshooting

### Using insecure Docker Registries

If you run an insecure Docker Registry (i.e. no SSL certificate), fx if you run it inside a local VM (you should NOT use insecure registries across the Internet), you need to tell your local Docker daemon to allow connections to it.

If you're using Docker Machine it's as simple as running the following commands. Replace `{REGISTRY_HOST}` with your registry's host and port (example `192.168.123.123:5000`).

**WARNING**: This will delete all your current images. If you want to keep them you need to use different names than `default`.

```
docker-machine stop default
docker-machine rm default
docker-machine create --driver virtualbox --engine-insecure-registry {REGISTRY_HOST} default
eval "$(docker-machine env default)"
```
