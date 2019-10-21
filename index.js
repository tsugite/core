const {pipe,apply,juxt,flatten,propEq,identity,remove,assocPath,mergeDeepRight,nth,not} = require('ramda')
const {merge,Subject} = require('rxjs')
const {filter, map, switchMap, share, groupBy, takeWhile} = require('rxjs/operators')
const {paths} = require('./ramda')

const {makeInternal} = require('./ports')

const plug = (func, ...args) =>
  pipe(paths([...args]), apply(func))

const compose = (...circuits) =>
  pipe(juxt([...circuits]), flatten, apply(merge))

const portsToContainer = (group$, ports) => {
  const temp = ports.map(port => {
    const source$ = group$.pipe(
      filter(propEq('key', port)),
      switchMap(identity),
      map(remove(0,1)),
      share())

    const sink = (...args) =>
      [port, ...args]

    return assocPath(port.split('.'), {source$, sink}, {})
  })

  return temp.reduce(mergeDeepRight, {})
}

const product = (stream, ports, handler=stream$=>stream$) => {
  const subject$ = new Subject,
    events$ = subject$.asObservable(),
    group$ = events$.pipe(groupBy(nth(0))),
    container = portsToContainer(group$, makeInternal(ports)),
    stream$ = stream(Object.assign({}, {
        root:{
          next: {
            sink: subject$.next
          }
        }
      },
      container))

  handler(stream$)
    .pipe(takeWhile(pipe(propEq(0, ports.root.terminated.join('.')), not)))
    .subscribe(subject$)

  subject$.next([ports.root.init.join('.')])

  return subject$
}

const source = port =>
  port.concat('source$')

const sink = port =>
  port.concat('sink')

module.exports = {plug, compose, portsToContainer, product, source, sink}