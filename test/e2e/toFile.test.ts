import { test } from 'tap'
import { fixture } from '../utils/paths'
import { tempDir } from '../utils/tmp'
// a plain require() is needed: the tests replace (stub) functions of the module
import fs = require('fs')
import * as path from 'path'
import * as sinon from 'sinon'
import * as QRCode from '../../lib'
import type { QRCodeSegment } from '../../lib'
import { removeNativePromise, restoreNativePromise } from '../utils/native-promise'
import { WritableStreamMock } from '../utils/writable-stream-mock'

test('toFile - no promise available', function (t) {
  removeNativePromise()
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.png')

  t.throws(function () { QRCode.toFile(fileName, 'some text') },
    'Should throw if a callback is not provided')

  t.throws(function () { QRCode.toFile(fileName, 'some text', {}) },
    'Should throw if a callback is not a function')

  t.end()

  restoreNativePromise()
})

test('toFile', function (t) {
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.png')

  // @ts-expect-error: missing path
  t.throws(function () { QRCode.toFile('some text', function () {}) },
    'Should throw if path is not provided')

  // @ts-expect-error: missing text
  t.throws(function () { QRCode.toFile(fileName) },
    'Should throw if text is not provided')

  const promise = QRCode.toFile(fileName, 'some text')
  t.equal(typeof promise.then, 'function',
    'Should return a promise')

  // the test directory is removed when the test ends: wait for the write
  promise.then(function () { t.end() })
})

test('toFile png', function (t) {
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.png')
  const fileName2 = path.join(dir, 'qrimage-2.png')
  const fileName3 = path.join(dir, 'qrimage-3.png')
  const fileName4 = path.join(dir, 'qrimage-4.png')
  const fileName5 = path.join(dir, 'qrimage-5.png')
  const expectedBase64Output = [
    'iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKzSU',
    'RBVO3BQW7kQAwEwSxC//9y7h55akCQxvYQjIj/scYo1ijFGqVYoxRrlGKNUqxRijVKsUYp',
    '1ijFGqVYoxRrlGKNUqxRijXKxUNJ+EkqdyShU+mS0Kl0SfhJKk8Ua5RijVKsUS5epvKmJD',
    'yh8iaVNyXhTcUapVijFGuUiw9Lwh0qdyShU+mS0Kl0Kk8k4Q6VTyrWKMUapVijXHw5lROV',
    'kyR0Kt+sWKMUa5RijXIxTBI6lS4JkxVrlGKNUqxRLj5M5Tcl4UTlCZW/pFijFGuUYo1y8b',
    'Ik/KQkdCpdEjqVLgmdykkS/rJijVKsUYo1ysVDKt9M5UTlmxRrlGKNUqxRLh5Kwh0qXRJ+',
    'UxLuULkjCZ3KJxVrlGKNUqxRLh5S6ZLQqXRJ6FS6JHQqXRKeSEKn0iWhUzlJwolKl4QTlS',
    'eKNUqxRinWKBe/LAmdSpeETuUkCZ1Kl4QTlS4Jd6h0SehUuiS8qVijFGuUYo1y8WFJ6FS6',
    'JJyofFISOpVOpUtCp3KicqLypmKNUqxRijXKxYep3JGEE5UuCZ3KHSp3qHRJ6FR+U7FGKd',
    'YoxRol/scXS8ITKidJeEKlS8KJyhPFGqVYoxRrlIuHkvCTVE5U7kjCicpJEk6S8JOKNUqx',
    'RinWKBcvU3lTEu5IwolKp/KEyh1J6FTeVKxRijVKsUa5+LAk3KHyJpWTJHQqdyShU/lNxR',
    'qlWKMUa5SLL6fSJaFLwhNJeCIJP6lYoxRrlGKNcvHlknCicpKEE5UuCSdJOFHpktCpPFGs',
    'UYo1SrFGufgwlZ+k0iWhU+lUnlDpktCpdEnoVN5UrFGKNUqxRrl4WRL+EpU7ktCpdCpdEj',
    'qVO5LQqTxRrFGKNUqxRon/scYo1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlGKN',
    'UqxRijXKP0OHEepgrecVAAAAAElFTkSuQmCC'].join('')

  t.plan(8)

  QRCode.toFile(fileName, 'i am a pony!', {
    errorCorrectionLevel: 'L'
  }, function (err) {
    t.ok(!err, 'There should be no error')

    fs.stat(fileName, function (err) {
      t.ok(!err,
        'Should save file with correct file name')
    })

    fs.readFile(fileName, function (err, buffer) {
      if (err) throw err

      t.equal(buffer.toString('base64'), expectedBase64Output,
        'Should write correct content')
    })
  })

  QRCode.toFile(fileName2, 'i am a pony!', {
    errorCorrectionLevel: 'L',
    type: 'png'
  }, function (err) {
    t.ok(!err, 'There should be no errors if file type is specified')
  })

  QRCode.toFile(fileName3, 'i am a pony!', {
    errorCorrectionLevel: 'L'
  }).then(function () {
    fs.stat(fileName3, function (err) {
      t.ok(!err,
        'Should save file with correct file name (promise)')
    })

    fs.readFile(fileName3, function (err, buffer) {
      if (err) throw err

      t.equal(buffer.toString('base64'), expectedBase64Output,
        'Should write correct content (promise)')
    })
  })

  const fsStub = sinon.stub(fs, 'createWriteStream')
  fsStub.returns(new WritableStreamMock().forceErrorOnWrite() as unknown as fs.WriteStream)

  QRCode.toFile(fileName4, 'i am a pony!', {
    errorCorrectionLevel: 'L'
  }, function (err) {
    t.ok(err, 'There should be an error')
  })

  QRCode.toFile(fileName5, 'i am a pony!', {
    errorCorrectionLevel: 'L'
  }).catch(function (err) {
    t.ok(err, 'Should catch an error (promise)')
  })

  fsStub.restore()
})

test('toFile svg', function (t) {
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.svg')
  const fileName2 = path.join(dir, 'qrimage-2.svg')
  const fileName3 = path.join(dir, 'qrimage-3.svg')
  const expectedOutput = fs.readFileSync(
    fixture('svg.expected.out'), 'utf8')

  t.plan(6)

  QRCode.toFile(fileName, 'http://www.google.com', {
    errorCorrectionLevel: 'H'
  }, function (err) {
    t.ok(!err, 'There should be no error')

    fs.stat(fileName, function (err) {
      t.ok(!err,
        'Should save file with correct file name')
    })

    fs.readFile(fileName, 'utf8', function (err, content) {
      if (err) throw err
      t.equal(content, expectedOutput,
        'Should write correct content')
    })
  })

  QRCode.toFile(fileName2, 'http://www.google.com', {
    errorCorrectionLevel: 'H',
    type: 'svg'
  }, function (err) {
    t.ok(!err, 'There should be no errors if file type is specified')
  })

  QRCode.toFile(fileName3, 'http://www.google.com', {
    errorCorrectionLevel: 'H'
  }).then(function () {
    fs.stat(fileName3, function (err) {
      t.ok(!err,
        'Should save file with correct file name (promise)')
    })

    fs.readFile(fileName3, 'utf8', function (err, content) {
      if (err) throw err
      t.equal(content, expectedOutput,
        'Should write correct content (promise)')
    })
  })
})

test('toFile utf8', function (t) {
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.txt')
  const fileName2 = path.join(dir, 'qrimage-2.txt')
  const fileName3 = path.join(dir, 'qrimage-3.txt')
  const expectedOutput = [
    '                                 ',
    '                                 ',
    '    █▀▀▀▀▀█ █ ▄█  ▀ █ █▀▀▀▀▀█    ',
    '    █ ███ █ ▀█▄▀▄█ ▀▄ █ ███ █    ',
    '    █ ▀▀▀ █ ▀▄ ▄ ▄▀ █ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ ▀ ▀ █▄▀ █ ▀▀▀▀▀▀▀    ',
    '    ▀▄ ▀▀▀▀█▀▀█▄ ▄█▄▀█ ▄█▄██▀    ',
    '    █▄ ▄▀▀▀▄▄█ █▀▀▄█▀ ▀█ █▄▄█    ',
    '    █▄ ▄█▄▀█▄▄  ▀ ▄██▀▀ ▄  ▄▀    ',
    '    █▀▄▄▄▄▀▀█▀▀█▀▀▀█ ▀ ▄█▀█▀█    ',
    '    ▀ ▀▀▀▀▀▀███▄▄▄▀ █▀▀▀█ ▀█     ',
    '    █▀▀▀▀▀█ █▀█▀▄ ▄▄█ ▀ █▀ ▄█    ',
    '    █ ███ █ █ █ ▀▀██▀███▀█ ██    ',
    '    █ ▀▀▀ █  █▀ ▀ █ ▀▀▄██ ███    ',
    '    ▀▀▀▀▀▀▀ ▀▀▀  ▀▀ ▀    ▀  ▀    ',
    '                                 ',
    '                                 '].join('\n')

  t.plan(6)

  QRCode.toFile(fileName, 'http://www.google.com', function (err) {
    t.ok(!err, 'There should be no error')

    fs.stat(fileName, function (err) {
      t.ok(!err,
        'Should save file with correct file name')
    })

    fs.readFile(fileName, 'utf8', function (err, content) {
      if (err) throw err
      t.equal(content, expectedOutput,
        'Should write correct content')
    })
  })

  QRCode.toFile(fileName2, 'http://www.google.com', {
    errorCorrectionLevel: 'M',
    type: 'utf8'
  }, function (err) {
    t.ok(!err, 'There should be no errors if file type is specified')
  })

  QRCode.toFile(fileName3, 'http://www.google.com')
    .then(function () {
      fs.stat(fileName3, function (err) {
        t.ok(!err,
          'Should save file with correct file name (promise)')
      })

      fs.readFile(fileName3, 'utf8', function (err, content) {
        if (err) throw err
        t.equal(content, expectedOutput,
          'Should write correct content (promise)')
      })
    })
})

test('toFile manual segments', function (t) {
  const dir = tempDir(t)
  const fileName = path.join(dir, 'qrimage.txt')
  const segs: QRCodeSegment[] = [
    { data: 'ABCDEFG', mode: 'alphanumeric' },
    { data: '0123456', mode: 'numeric' }
  ]
  const expectedOutput = [
    '                             ',
    '                             ',
    '    █▀▀▀▀▀█ ██▀██ █▀▀▀▀▀█    ',
    '    █ ███ █  █▀█▄ █ ███ █    ',
    '    █ ▀▀▀ █ █ ▄ ▀ █ ▀▀▀ █    ',
    '    ▀▀▀▀▀▀▀ █▄█▄▀ ▀▀▀▀▀▀▀    ',
    '    ▀██ ▄▀▀▄█▀▀▀▀██▀▀▄ █▀    ',
    '     ▀█▀▀█▀█▄ ▄ ▄█▀▀▀█▀      ',
    '    ▀ ▀▀▀ ▀ ▄▀ ▄ ▄▀▄  ▀▄     ',
    '    █▀▀▀▀▀█ ▄  █▀█ ▀▀▀▄█▄    ',
    '    █ ███ █  █▀▀▀ ██▀▀ ▀▀    ',
    '    █ ▀▀▀ █ ██  ▄▀▀▀▀▄▀▀█    ',
    '    ▀▀▀▀▀▀▀ ▀    ▀▀▀▀ ▀▀▀    ',
    '                             ',
    '                             '].join('\n')
  t.plan(3)

  QRCode.toFile(fileName, segs, {
    errorCorrectionLevel: 'L'
  }, function (err) {
    t.ok(!err, 'There should be no errors if text is not string')

    fs.stat(fileName, function (err) {
      t.ok(!err,
        'Should save file with correct file name')
    })

    fs.readFile(fileName, 'utf8', function (err, content) {
      if (err) throw err
      t.equal(content, expectedOutput,
        'Should write correct content')
    })
  })
})
