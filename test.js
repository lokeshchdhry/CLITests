'use strict';

const
    program = require('commander'),
    VER = require('./package.json').version,
    fs = require('fs-extra'),
    setup = require('./setup'),
    // isSetupRun = require('./util').isSetupRun,
    util = require('./util'),
    kill = require('tree-kill');


program
.version(VER)
// .option('-p, --platforms', 'Run CLI tests on the given platforms. Defaults to \'android,ios\'.', 'android,ios')
.option('-s, --sdk', 'Run the CLI tests with the specified SDK or from specified branch. Defaults to latest from the master branch.', 'master')
// .option('-t, --testType', 'Type of the test to run (Device build, Emulator/Simulator build, Packaging, Module build/packaging, all). Defaults to \'all\'.', 'all')
// .option('-T, --deviceType', 'Type of device to run tests on (device, emulator(Android), simulator(IOS)). Defaults to \'emulator(Android)\' & \'simulator(IOS)\'.', 'emulator')
.parse(process.argv);

const
  s_flag = process.argv[2];               //Get the -s flag
let
  inputSDK = process.argv[3];             //Get the SDK entered

setup(s_flag)                             //Check if setup is run if not run it first
.then(result => {
  console.log(result);
  return util.isSDKInstalled(inputSDK);   //Then check if specified SDK is already installed
})
.then(sdkobj => {
  console.log(sdkobj);
  if(sdkobj.isInstalled === false){       //If not installed
    return util.installSDK(sdkobj)        //Install the sdk
    .then(val => {
      return util.selectSDK(val);         //select the installed sdk in the CLI
    })
    .then(result => {
      console.log('~~~~~~'+result);
      return result;                      //return the result to the next then
    });
  }
  else {
    return util.selectSDK(inputSDK)       //If sdk is already installed then select it in CLI
    .then(result => {
      console.log('~*~*~*~*~'+result);
      return result;                      //return the result to the next then
    });
  }
})
.then(done => {
  console.log('&&&&&'+done);
  if(done){
    return util.createProject();
  }
})
.then(done => {
  console.log('$$$$$'+done);
  return util.androidEmuBuild();          //build the app to emu & return the pid to then
})
.then(pid => {
  console.log('Killing process '+pid+' & closing emulator.');
  kill(pid);                              //After getting the pid kill the process tree
  console.log('DONE');
  return util.androidDeviceBuild();       //Run the device build
})
.then(pid => {
  console.log('Killing process '+pid+'.');
  kill(pid);                              //After getting the pid kill the process tree
  console.log('DONE');
  return util.androidPackage();           //Run the packaging test
})
.then(pid => {
  console.log('Killing process '+pid+'.');
  kill(pid);                              //After getting the pid kill the process tree
  console.log('DONE');
  return util.installAPKOnDevice();       //Install the apk on the connected device
})
.then(done => {
  console.log('$$$$$'+done);              
})
.catch(err=>{
  console.log(err);
});
