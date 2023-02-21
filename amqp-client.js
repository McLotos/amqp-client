const
connect = async connectionParams => {
  return require('amqplib')
  .connect(connectionParams.url, connectionParams.options)
},
addHandlers = async (connection, queue, exchanges, binds, useAMQP) => {
  connection.on('close', () => amqp(connection, queue, exchanges, binds, useAMQP))
  connection.on('error', error => console.log('error', error))
  return connection
},
createChannel = async connection => connection.createChannel(),
assertQueue = async (channel, queueName, queueOptions) => {
  await channel.assertQueue(queueName, queueOptions)
  return channel
},
assertExchanges = async (channel, exchanges) => {
  exchanges.forEach(async exchange => {
    await channel.assertExchange(exchange.name, exchange.type, exchange?.options)
  })
  return channel
},
bindQueue = async (channel, queue, binds) => {
  binds.forEach(bind => {
    if (bind.keys) {
      bind.keys.forEach(key => channel.bindQueue(queue, bind.exchange, key))
    } else {
      channel.bindQueue(queue, bind.exchange, '')
    }
  })
  return channel
},
amqp = (connectionParams, queue, exchanges, binds, useAMQP, interval = 10000) => {
    connect(connectionParams)
    .then(connection => addHandlers(connection))
    .then(connection => createChannel(connection))
    .then(channel => assertQueue(channel, queue.name, queue.options))
    .then(channel => assertExchanges(channel, exchanges))
    .then(channel => bindQueue(channel, queue.name, binds))
    .then(channel => useAMQP(channel))
    .catch(e => setTimeout(() => {
        console.log(e)
        amqp(connectionParams, queue, exchanges, binds, useAMQP)
      }, interval)
    )
}

module.exports = {
  connect,
  addHandlers,
  createChannel,
  assertQueue,
  assertExchanges,
  bindQueue,
  amqp
}