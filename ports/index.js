const {assocPath,mergeDeepRight,flatten} = require('ramda')

const portMapWalk = (value, ns=[]) => {
  if (value) {
    return [
      ...Object.entries(value)
        .map(([key, value]) =>
          portMapWalk(value, ns.concat(key)))
    ]
  } else {
    return assocPath(ns, ns, {})
  }
}

const makePorts = (moduleName, portMap) =>
  flatten(portMapWalk({[moduleName]: portMap})).reduce(mergeDeepRight, {})

const prepare = portMap =>
  ({
    raw: portMap,
    default: flatten(portMapWalk(portMap)).reduce(mergeDeepRight, {})
  })

const internalWalk = value => {
  if (Array.isArray(value)) {
    return value.join('.')
  } else {
    return Object.entries(value)
      .map(([key, value]) =>
        internalWalk(value))
  }
}

const makeInternal = ports =>
  flatten(internalWalk(ports))

module.exports = {makePorts,portMapWalk,internalWalk, makeInternal, prepare}