import neostandard from 'neostandard'

export default [
  ...neostandard({
    ts: true,
    ignores: [
      // generated (see tsconfig.json and rollup.config.js)
      'lib/',
      'helper/',
      'bin/',
      'build/',
      'coverage/',
      '.cache/',
      // third party
      'examples/vendors/'
    ]
  })
]
