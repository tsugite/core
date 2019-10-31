const {pipe,apply,juxt,flatten,propEq,identity,remove,assocPath,mergeDeepRight,nth,not} = require('ramda')
const {merge,Subject} = require('rxjs')
const {filter, map, switchMap, share, groupBy, takeWhile} = require('rxjs/operators')
const {paths} = require('./ramda')

const {makeInternal,prepare} = require('./ports')

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

const run = (stream, ports, root, handler=stream$=>stream$) => {
  const subject$ = new Subject,
    events$ = subject$.asObservable(),
    group$ = events$.pipe(groupBy(nth(0))),
    container = portsToContainer(group$, makeInternal(ports)),
    stream$ = stream(container)

  handler(stream$)
    .pipe(takeWhile(pipe(propEq(0, root.terminated.join('.')), not)))
    .subscribe(subject$)

  subject$.next([root.init.join('.'), true])

  return subject$
}

const source = port =>
  port.concat('source$')

const sink = port =>
  port.concat('sink')

module.exports = {plug, compose, portsToContainer, run, source, sink, prepare}
