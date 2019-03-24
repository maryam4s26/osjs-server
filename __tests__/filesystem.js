const fs = require('fs-extra');
const osjs = require('osjs');
const path = require('path');
const Filesystem = require('../src/filesystem.js');
const {Response} = require('jest-express/lib/response');
const {Request} = require('jest-express/lib/request');

describe('Filesystem', () => {
  let core;
  let filesystem;
  let mountpoint;

  beforeAll(() => osjs().then(c => {
    core = c;
    filesystem = c.make('osjs/fs');
  }));

  afterAll(() => core.destroy());

  /* Already inited from provider
  test('#constructor', () => {
    filesystem = new Filesystem(core);
  });

  test('#init', () => {
    return expect(filesystem.init())
      .resolves
      .toBe(true);
  });
  */

  test('#mime', () => {
    expect(filesystem.mime('text file.txt'))
      .toBe('text/plain');

    expect(filesystem.mime('hypertext file.html'))
      .toBe('text/html');

    expect(filesystem.mime('image file.png'))
      .toBe('image/png');

    expect(filesystem.mime('unknown file.666'))
      .toBe('application/octet-stream');

    expect(filesystem.mime('defined file'))
      .toBe('test/jest');
  });

  test('#mount', () => {
    mountpoint = filesystem.mount({
      name: 'jest',
      attributes: {
        root: '/tmp'
      }
    });

    expect(mountpoint).toMatchObject({
      root: 'jest:/',
      attributes: {
        root: '/tmp'
      }
    });
  });

  test('#realpath', () => {
    const realPath = path.join(core.configuration.tempPath, 'jest/test');

    return expect(filesystem.realpath('home:/test', {
      username: 'jest'
    }))
      .resolves
      .toBe(realPath);
  });

  test('#request', async () => {
    const response = new Response();
    const request = new Request();

    request.session = {
      user: {
        username: 'jest'
      }
    };

    request.fields = {
      path: 'home:/test'
    };

    const result = await filesystem.request('exists', request, response);

    expect(result).toBe(false);
  });

  test('#unmount', () => {
    expect(filesystem.unmount(mountpoint))
      .toBe(true);
  });

  test('#unmount - test fail', () => {
    expect(filesystem.unmount({}))
      .toBe(false);
  });

  test('#watch - test emitter', async () => {
    const filename =  path.join(core.config('tempPath'), 'jest/watch.txt');
    const cb = jest.fn();

    core.on('osjs/vfs:watch:change', cb);
    fs.ensureDirSync(path.dirname(filename));
    fs.writeFileSync(filename, 'testing');

    await new Promise(resolve => {
      setTimeout(resolve, 250);
    });

    expect(cb).toBeCalledWith(expect.objectContaining({
      target: 'home:/watch.txt',
      mountpoint: filesystem.mountpoints.find(m => m.name === 'home')
    }));
  });

  test('#destroy', () => {
    filesystem = filesystem.destroy();
  });
});
