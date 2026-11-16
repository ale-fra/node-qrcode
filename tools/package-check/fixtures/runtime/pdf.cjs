const assert = require('node:assert/strict')
const QR = require('qrcode')

async function main () {
  const options = { rendererOpts: { size: 30, columns: 1, rows: 1 } }
  const pdf = await QR.toPdf(['one', [{ data: 'TWO', mode: 'alphanumeric' }]], options)
  assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4')
  assert.match(pdf.toString('latin1'), /\/Count 2\b/)
  assert.equal(QR.default.toPdf, QR.toPdf)
  const callback = await new Promise((resolve, reject) => QR.toPdf(['one', [{ data: 'TWO', mode: 'alphanumeric' }]], options,
    (err, data) => err ? reject(err) : resolve(data)))
  assert.deepEqual(callback, pdf)
  const single = await QR.toBuffer('one', { type: 'pdf' })
  const url = await QR.toDataURL('one', { type: 'application/pdf' })
  assert.equal(url, 'data:application/pdf;base64,' + single.toString('base64'))
}
main().catch((err) => { console.error(err); process.exitCode = 1 })
