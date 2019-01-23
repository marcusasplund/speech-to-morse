import { h, app } from 'hyperapp'
import './styles/app.scss'

const state = {
  prop: ''
}



const actions = {

  set: x => x,

  init: () => (state, actions) => {
    console.log('init')
  }
}

const view = (state, actions) => (
  h('main', {
    class: 'wrapper',
    oncreate: el => actions.init()
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
    }, )
  ])
)

app(state, actions, view, document.body)
