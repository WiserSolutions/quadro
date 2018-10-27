# Quadro jobs

Quadro allows you to easily execute recurring jobs in you application.

Simply create a file in `jobs/` and it will be ran within the specified interval.

```js
// jobs/demo.js
module.exports = class {
  constructor(log) {
    this.log = log
  }

  async run() {
    this.log.info('This job will be run every 0.5 sec')
  }
}

module.exports['@interval'] = 0.5
```

## Jobs and environments

Jobs are not being run when in `test` environment and in `repl` mode.

## Configuration

```yaml
# quadro.yml
jobs:
  all:
    enabled: false
  my_job_name:
    enabled: true
    interval: 50
```

## Job interval

Job interval can be specified in 2 ways:

- Via configuration `quadro.jobs.JOB_NAME.interval`
- Via ```module.exports['@interval']``` within the job module

**NOTE** All job intervals are specified in **SECONDS**
**NOTE** Interval can be fractions of the second
(e.g. 0.5 - will execute the job every 500 ms)
