require('dotenv').config()

const Discord = require('discord.js')
const rp = require('request-promise-native')
var fs = require('fs')
const client = new Discord.Client()

const linkRegex = /(https:\/\/discord.gift\/)(.*)/g

let waiting = false

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  setInterval(() => {
    if (waiting) {
      client.user.setPresence({ game: { type: 'LISTENING', name: '1 pessoa na fila.' } })
    } else {
      const atual = require('./info.json')
      client.user.setPresence({ game: { type: 'WATCHING', name: `${atual.trades} trocas feitas até agora.` } })
    }
  }, 15000)
})

client.on('message', async msg => {
  if (msg.author.bot) return
  if (msg.content.startsWith('gift!')) {
    const fullcmd = msg.content.replace('gift!', '')
    const args = fullcmd.split(' ')
    const cmd = args.shift()
    if (cmd === 'start') {
      msg.author.send(`Olá! Bem vindo ao serviço de troca de codigos Nitro do discord.\nEu sou um bot que irá garantir que você possa trocar seu código com alguem que também quer ter Nitro de forma segura.\nPara realizar a troca, me envie o link do seu presente para eu poder redirecioná-lo para alguem com um convite válido também.\nLogo após eu encontrar uma pessoa para trocar com você, ao mesmo tempo, os dois receberão uma mensagem com os respectivos links de ativação.\nNão nos responsabilizamos em casos de ativação do código após o recebimento.\n\nPessoas na fila de espera: ${waiting ? '1. Se enviar um link, a troca irá começar instantaneamente' : '0. Você deverá esperar na fila.'}\n\nEnvie uma mensagem com seu link Nitro para dar início a troca:`).catch(() => msg.channel.send(`${msg.author} desculpe, mas não consegui te enviar mensagens no privado.`)).then(msg.channel.send(`${msg.author} te enviei mais informações no privado.`))
    }
  } else if (msg.content.startsWith('!trocar')) {
    msg.author.send(`Olá! Bem vindo ao serviço de troca de codigos Nitro do discord.\nEu sou um bot que irá garantir que você possa trocar seu código com alguem que também quer ter Nitro de forma segura.\nPara realizar a troca, me envie o link do seu presente para eu poder redirecioná-lo para alguem com um convite válido também.\nLogo após eu encontrar uma pessoa para trocar com você, ao mesmo tempo, os dois receberão uma mensagem com os respectivos links de ativação.\nNão nos responsabilizamos em casos de ativação do código após o recebimento.\n\nPessoas na fila de espera: ${waiting ? '1. Se enviar um link, a troca irá começar instantaneamente' : '0. Você deverá esperar na fila.'}\n\nEnvie uma mensagem com seu link Nitro para dar início a troca:`).catch(() => msg.channel.send(`${msg.author} desculpe, mas não consegui te enviar mensagens no privado.`)).then(msg.channel.send(`${msg.author} te enviei mais informações no privado.`))
  } else if (msg.content.startsWith('!cancelar') && msg.channel.type === 'dm' && waiting.channel.id === msg.channel.id) {
    waiting = false
    msg.channel.send('Cancelado.')
  } else if (msg.channel.type === 'dm') {
    if (linkRegex.test(msg.content)) {
      const code = msg.content.match(linkRegex)[0].replace('https://discord.gift/', '')
      const check = await checkCode(code)
      if (!check) return msg.channel.send('Desculpe, mas esse link é invalido ou já foi utilizado.')
      if (check) start(msg, code)
    } else {
      msg.author.send(`Olá! Bem vindo ao serviço de troca de codigos Nitro do discord.\nEu sou um bot que irá garantir que você possa trocar seu código com alguem que também quer ter Nitro de forma segura.\nPara realizar a troca, me envie o link do seu presente para eu poder redirecioná-lo para alguem com um convite válido também.\nLogo após eu encontrar uma pessoa para trocar com você, ao mesmo tempo, os dois receberão uma mensagem com os respectivos links de ativação.\nNão nos responsabilizamos em casos de ativação do código após o recebimento.\n\nPessoas na fila de espera: ${waiting ? '1. Se enviar um link, a troca irá começar instantaneamente' : '0. Você deverá esperar na fila.'}\n\nEnvie uma mensagem com seu link Nitro para dar início a troca:`).catch(() => msg.channel.send(`${msg.author} desculpe, mas não consegui te enviar mensagens no privado.`))
    }
  }
})

client.login(process.env.TOKEN)

async function start (msg, code) {
  if (waiting) {
    const target = waiting
    const check = await checkCode(target.code)
    if (!check) {
      waiting = { code, channel: msg.channel }
      return msg.channel.send('Você foi adicionado a lista de espera.')
    }
    waiting = false
    msg.channel.send('Encontrei alguém para trocar com você. A troca será realizada em 1 minuto, se prepare\nATENÇÃO: ative o código o mais rapido possivel após o recebimento.')
    target.channel.send('Encontrei alguém para trocar com você. A troca será realizada em 1 minuto, se prepare\nATENÇÃO: ative o código o mais rapido possivel após o recebimento.')
    setTimeout(() => {
      msg.channel.send('30 segundos restantes.')
      target.channel.send('30 segundos restantes.')
      setTimeout(() => {
        msg.channel.send('10 segundos restantes.')
        target.channel.send('10 segundos restantes.')
        setTimeout(() => {
          msg.channel.send('5 segundos restantes.')
          target.channel.send('5 segundos restantes.')
          setTimeout(async () => {
            const check1 = await checkCode(code)
            const check2 = await checkCode(target.code)
            if (check1 && check2) {
              console.log(`Trade: ${msg.channel.recipient.id} x ${target.channel.recipient.id}`)
              msg.channel.send(`Troca realizada. Seu link é: https://discord.gift/${target.code} Aproveite!`)
              target.channel.send(`Troca realizada. Seu link é: https://discord.gift/${code} Aproveite!`)
              const atual = require('./info.json')
              atual.trades = atual.trades + 1
              fs.writeFile('info.json', JSON.stringify(atual), (err) => {
                if (err) {
                  console.log(err)
                }
              })
            } else if (!check1) {
              msg.channel.send('Seu link é invalido. A troca foi cancelada')
              target.channel.send('Desculpe, mas o link da outra pessoa passou a ser inválido.')
              start(target, target.code)
            } else if (!check2) {
              msg.channel.send('Desculpe, mas o link da outra pessoa passou a ser inválido.')
              target.channel.send('Seu link é invalido. A troca foi cancelada')
              start(msg, code)
            }
          }, 5000)
        }, 5000)
      }, 20000)
    }, 30000)
  } else {
    waiting = { code, channel: msg.channel }
    msg.channel.send('Você foi adicionado a lista de espera. Digite `!cancelar` se você for sair do computador por questões de segurança.')
    console.log(waiting, 'added')
  }
}

async function checkCode (code) {
  const b = await rp(`https://discordapp.com/api/v6/entitlements/gift-codes/${code}`)
  const data = JSON.parse(b)
  if (data.store_listing.sku.name !== 'Nitro') return false
  if (data.uses >= data.max_uses) return false
  if (Date.now() > Date.parse(data.expires_at)) return false
  return true
}
