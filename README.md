# nimbus-cli

An experimental cli for creating nimbus experiments

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/nimbus-cli.svg)](https://npmjs.org/package/nimbus-cli)
[![Downloads/week](https://img.shields.io/npm/dw/nimbus-cli.svg)](https://npmjs.org/package/nimbus-cli)
[![License](https://img.shields.io/npm/l/nimbus-cli.svg)](https://github.com/k88hudson/nimbus-cli/blob/master/package.json)

<!-- toc -->
* [nimbus-cli](#nimbus-cli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g nimbus-cli
$ nimbus-cli COMMAND
running command...
$ nimbus-cli (-v|--version|version)
nimbus-cli/0.5.0 darwin-x64 node-v14.14.0
$ nimbus-cli --help [COMMAND]
USAGE
  $ nimbus-cli COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`nimbus-cli create`](#nimbus-cli-create)
* [`nimbus-cli help [COMMAND]`](#nimbus-cli-help-command)
* [`nimbus-cli manifest`](#nimbus-cli-manifest)
* [`nimbus-cli preview`](#nimbus-cli-preview)

## `nimbus-cli create`

create a nimbus experiment

```
USAGE
  $ nimbus-cli create
```

_See code: [src/commands/create.ts](https://github.com/k88hudson/nimbus-cli/blob/v0.5.0/src/commands/create.ts)_

## `nimbus-cli help [COMMAND]`

display help for nimbus-cli

```
USAGE
  $ nimbus-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `nimbus-cli manifest`

Download nimbus manifest (Desktop only right now)

```
USAGE
  $ nimbus-cli manifest

OPTIONS
  -c, --channel=nightly|beta|release  [default: nightly] Channel. NOTE: Desktop only
  --schema=schema                     Convert variables for manifest entry to json schema
```

_See code: [src/commands/manifest.ts](https://github.com/k88hudson/nimbus-cli/blob/v0.5.0/src/commands/manifest.ts)_

## `nimbus-cli preview`

find test ids to force an experiment branch

```
USAGE
  $ nimbus-cli preview
```

_See code: [src/commands/preview.ts](https://github.com/k88hudson/nimbus-cli/blob/v0.5.0/src/commands/preview.ts)_
<!-- commandsstop -->
