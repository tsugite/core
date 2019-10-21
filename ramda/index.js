const {juxt,path,map} = require('ramda')

const paths = indexes =>
  juxt(map(idx => path(idx), indexes))

module.exports = {paths}