# Pubsub

Quado uses https://github.com/igorshapiro/hubjs for pub sub

To be able to publish message use `pubsub` dependency.

Add following config to service to enable pull model of pubsub add a service.yml file with following configuration to config folder

```yaml
name: 'service_name'
hub: #Optional
  host: 'http://hub:8080' #Optional
messages:
  host: 'amqp://localhost'
  input: 'service_in' #Optional default value is `${name}_in`
  output: 'service_out' #Optional default value is `${name}_out`
  concurrency: 10 #Optional default value is 10
storage:
  host: 'mongodb://localhost:27017/hub'
  schedule: 'service_schedule' #Optional default value is `${name}_schedule`
  dead: 'service_dead_v2' #Optional default value is `${name}_dead_v2`
retrySchedule: [ 1000, 6000 , 60000 ] #Optional retries frequency   
```

# API

## .publish(messageType, messageContent)
publishes a message to rabbitmq

## Receive Message

To recieve messages add a handler class that implements handle method to the handler folder with the name `${messageType}.js`

Quadro will automatically picks the handler on startup and registers it. It will receive all the messages from the input queue and routes the message to appropriate handler base don messageType
