// Run with: node examples/cli.mts (Node.js >= 22.18, after `pnpm build`)
import QRCode from '../lib/index.js'

QRCode.toString('yo yo yo', function (error, data) {
  if (error) {
    throw error
  }

  console.log(data)
})
