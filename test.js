'use strict';

const
    program = require('commander'),
    VER = require('./package.json').version,
    setup = require('./setup'),
    // isSetupRun = require('./util').isSetupRun,
    util = require('./util'),
    kill = require('tree-kill'),
    color = require('./colors');


program
.version(VER)
// .option('-p, --platforms', 'Run CLI tests on the given platforms. Defaults to \'android,ios\'.', 'android,ios')
.option('-s, --sdk', 'Run the CLI tests with the specified SDK or from specified branch. Defaults to latest from the master branch.', 'master')
// .option('-t, --testType', 'Type of the test to run (Device build, Emulator/Simulator build, Packaging, Module build/packaging, all). Defaults to \'all\'.', 'all')
// .option('-T, --deviceType', 'Type of device to run tests on (device, emulator(Android), simulator(IOS)). Defaults to \'emulator(Android)\' & \'simulator(IOS)\'.', 'emulator')
.parse(process.argv);

const
  s_flag = process.argv[2];                                                     //Get the -s flag
let
  inputSDK = process.argv[3];                                                   //Get the SDK entered

setup(s_flag)                                                                   //Check if setup is run if not run it first
.then(result => {
  console.log(color.underline(color.bold('\nCHECKING IF SDK IS INSTALLED.')));
  // console.log(result);
  return util.isSDKInstalled(inputSDK);                                         //Then check if specified SDK is already installed
})
.then(sdkobj => {
  // console.log(sdkobj);
  if(sdkobj.isInstalled === false){                                             //If not installed
    console.log('SDK not installed. Installing SDK .....');
    return util.installSDK(sdkobj)                                              //Install the sdk
    .then(val => {
      console.log('Selecting in CLI the SDK: '+val);
      return util.selectSDK(val);                                               //select the installed sdk in the CLI
    })
    .then(result => {
      // console.log('~~~~~~'+result);
      return result;                                                            //return the result to the next then
    });
  }
  else {
    return util.selectSDK(inputSDK)                                             //If sdk is already installed then select it in CLI
    .then(result => {
      // console.log('~*~*~*~*~'+result);
      return result;                                                            //return the result to the next then
    });
  }
})
.then(done => {
  // console.log('&&&&&'+done);
  if(done){
    console.log(color.underline(color.bold('\nCREATING APP PROJECT.')));
    return util.createProject();
  }
})
.then(done => {
  console.log(color.underline(color.bold('\nANDROID EMULATOR BUILD.')));
  console.log(color.dim('Running emulator build .....'));
  // console.log('$$$$$'+done);
  return util.androidEmuBuild();                                                //build the app to native android emu & return the pid to then
})
.then(pid => {
  console.log('\u2714 Closing android emulator.');
  // console.log('Killing process '+pid+' & closing native android emulator.');
  return util.killProcess(pid);                                                 //After getting the pid kill the process tree
})
.then(() => {
  console.log(color.underline(color.bold('\nANDROID DEVICE BUILD.')));
  console.log(color.dim('Running android device build .....'));
  return util.androidDeviceBuild();                                             //Run the device build
})
.then(pid => {
  // console.log('Killing process '+pid);
  return util.killProcess(pid);                                                 //After getting the pid kill the process tree
})
.then(() => {
  console.log(color.underline(color.bold('\nANDROID GENYMOTION BUILD.')));
  console.log(color.dim('Running genymotion build .....'));
  return util.androidEmuBuild('geny');                                          //Run the genymotion build
})
.then(pid => {
  util.killVbox();
  console.log('\u2714 Closing genymotion emulator.');
  // console.log('Killing process '+pid+' & closing genymotion emulator.');
  return util.killProcess(pid);
})
.then(() => {
  console.log(color.underline(color.bold('\nANDROID PACKAGING.')));
  console.log(color.dim('Running packaging .....'));
  return util.androidPackage();                                                 //Run the packaging test
})
.then(pid => {
  // console.log('Killing process '+pid+'.');
  return util.killProcess(pid);                                                 //After getting the pid kill the process tree
})
.then(() => {
  console.log(color.underline(color.bold('\nINSTALLING APK ON DEVICE.')));
  return util.installAPKOnDevice();                                             //Install the apk on the connected device
})
.then(done => {
  console.log('Done running app tests.');
})
.catch(err=>{
  console.log('Failed to run all tests: '+err);
});
