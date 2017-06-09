'use strict';
const spawn = require('child_process').spawn;
const path = require('path');

function spawnChildProcess(command, args) {
  console.log('Running command: ', command, args.join(' '));
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: [process.stdin, process.stdout, 'pipe'],
    });

    const errors = [];

    proc.stderr.on('data', errorMessage => {
      errors.push(errorMessage);
    });

    proc.on('error', err => {
      console.error(`\`${command} ${args.join(' ')}\` failed`, err);
      reject(err);
    });

    proc.on('close', () => {
      if (errors.length) {
        return reject(errors.join(''));
      }
      resolve();
    });
  });
}

function getPackageDependencies() {
  const pkg = require(path.resolve(process.cwd(), 'package.json'));
  return pkg.dependencies;
}

function getPackageVersion(packageName) {
  return getPackageDependencies()[packageName];
}

function installTypes(packageName) {
  const command = 'npm';
  const [name, askedVersion] = packageName.split('@');
  const version = askedVersion || getPackageVersion(packageName) || 'latest';

  const args = ['install', `@types/${name}@${version}`, '--no-save'];

  return spawnChildProcess(command, args).then(() =>
    console.log(
      `Package ${packageName} has been installed to node_modules/@types/${packageName}.`
    ));
}

function convertTypesToKotlin(packageName, destinationDir) {
  const [name] = packageName.split('@');
  const command = require.resolve('ts2kt');

  //TODO: *.d.ts file could be delivered with whole package instead like "moment" does
  //TODO:  types-metadata.json should be used instead!
  const args = [
    '-d',
    destinationDir,
    path.resolve('.', `./node_modules/@types/${name}/index.d.ts`),
  ];

  return spawnChildProcess(command, args).then(() =>
    console.log(
      `Types for ${name} has been converted and put into ${destinationDir}.`
    ));
}

module.exports = {
  installTypes,
  convertTypesToKotlin,
  getPackageDependencies,
};
