/* global webkitSpeechRecognition */
/* eslint-disable new-cap */
import { h, app } from 'hyperapp'
import './styles/app.scss'

let audioCtx = {}

let recognition = {}

const morseAlphabet = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  0: '-----',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  '!': '-.-.--',
  '-': '-....-',
  '/': '-..-.',
  '@': '.--.-.',
  '(': '-.--.',
  ')': '-.--.-'
}

const units = {
  short: 70,
  long: 210,
  space: 490
}
const state = {
  morse_code: '',
  recognizing: false,
  final_transcript: '',
  ignore_onend: false,
  start_timestamp: '',
  previousQuestion: '',
  interim_transcript: ''
}

const actions = {

  set: x => x,

  startListening: (e) => (state, actions) => {
    recognition = new webkitSpeechRecognition()
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onstart = function () {
      actions.set({
        recognizing: true,
        final_transcript: '',
        previousQuestion: '',
        morse_code: ''
      })
    }

    recognition.onerror = function (event) {
      if (event.error === 'no-speech') {
        actions.set({
          info: 'info_no_speech',
          ignore_onend: true
        })
      }
      if (event.error === 'audio-capture') {
        actions.set({
          info: 'info_no_microphone',
          ignore_onend: true
        })
      }
      if (event.error === 'not-allowed') {
        if (event.timeStamp - state.start_timestamp < 100) {
          actions.set({
            info: 'info_blocked'
          })
        } else {
          actions.set({
            info: 'info_denied'
          })
        }
        actions.set({
          ignore_onend: true
        })
      }
    }

    recognition.onend = function () {
      actions.set({
        recognizing: false,
        previousQuestion: ''
      })
      if (state.ignore_onend) {
        return
      }
      if (!state.final_transcript) {
        actions.set({
          info: 'info_start'
        })
      }
    }

    recognition.onresult = function (event) {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          actions.set({
            final_transcript: event.results[i][0].transcript,
            interim_transcript: ''
          })
        } else {
          actions.set({
            interim_transcript: event.results[i][0].transcript,
            final_transcript: ''
          })
        }
      }
      if (state.final_transcript.length > 0 && state.final_transcript !== state.previousQuestion) {
        console.log('ok')
        // let utterance = new SpeechSynthesisUtterance(final_transcript);
        // window.speechSynthesis.speak(utterance);
      }
      actions.set({
        previousQuestion: state.final_transcript
      })
      actions.generateMorse()
      recognition.stop()
    }
    if (state.recognizing) {
      recognition.stop()
      return
    }
    actions.set({
      ignore_onend: false,
      start_timestamp: e.timeStamp
    })
    recognition.start()
  },

  generateMorse: () => (state, actions) => {
    let transcript = state.final_transcript || state.interim_transcript
    let letters = transcript.trim().replace(/\s+/, ' ').split('')
    let oscillator = audioCtx.createOscillator()
    let offset = 0
    let morse

    oscillator.type = 'triangle'
    oscillator.start(0)

    let connect = function () {
      oscillator.connect(audioCtx.destination)
    }

    let disconnect = function () {
      oscillator.disconnect(0)
    }

    while (letters.length) {
      let letter = letters.shift().toLowerCase()
      morse = morseAlphabet[letter].split('')
      actions.set({
        morse_code: state.morse_code += morseAlphabet[letter]
      })
      while (morse.length) {
        setTimeout(connect, offset)
        offset += morse.shift() === '.' ? units.short : units.long
        setTimeout(disconnect, offset)

        if (morse.length) {
          offset += units.short
        }
      }

      if (letters.length) {
        if (letters[0] === ' ') {
          offset += units.space
          letters.shift()
        } else {
          offset += units.long
        }
      }
    }

    setTimeout(function () {
      oscillator.disconnect(audioCtx.destination)
      oscillator.stop(0)
    }, offset)
  }
}

const view = (state, actions) => (
  h('main', {
    class: 'wrapper'
  }, [
    h('header', {}, [
      h('div', {
        class: 'container'
      }, [
        h('h1', {
          class: 'page-title'
        }, 'speech-to-morse')
      ])
    ]),
    h('div', {
      class: 'container paper'
    }, [
      h('button', {
        class: `${state.recognizing ? 'pulse-button pulse' : 'pulse-button'}`,
        onclick: e => actions.startListening(e)
      }),
      h('p', {}, `${state.interim_transcript || state.final_transcript}`),
      h('p', {}, `${state.morse_code}`),
      h('p', {}, state.info ? `Info: ${state.info}` : '')
    ])
  ])
)

app(state, actions, view, document.body)
