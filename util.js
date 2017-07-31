'use strict';

const spawn = require('child_process').spawn,
      exec = require('child_process').exec,
      execFile = require('child_process').execFile,
      configData = require('./test_config'),
      storage = require('node-persist'),
      setup = require('./setup'),
      fs = require('fs'),
      path = require('path'),
      os = require('os'),
      kill = require('tree-kill'),
      color = require('./colors'),
      adb = require('adbkit');

//Getting the platform
const platform = os.platform,
      FLAGS = ['--no-banner', '--no-colors', '--no-prompt'],
      BRANCH = 0,
      NO_BRANCH = 1,
      PATTERN0 = /_|^[A-z]/,     //Pattern to check if the sdk is a branch
      PATTERN1 = /You're up-to-date/g,    //Pattern to check if we have the latest sdk from the branch
      PATTERN2 = /successfully installed/g,    //Pattern to check if the sdk is successfully installed
      PATTERN3 = /_|^[A-z]/,
      //Getting the appc cli version from the .version file
      installFolderPath = path.join('/Users', process.env.USER, '.appcelerator', 'install'),
      verFile = path.join(installFolderPath, '.version'),
      appPath = path.join(__dirname, 'projects', 'CLItestApp'),
      genFilePath = path.join(__dirname, 'generatedfiles'),
      apkPath = path.join(__dirname, 'generatedfiles', 'CLItestApp.apk');

let
  appcExe, pathPart, appc_ver;

if(fs.existsSync(verFile)){ //Checking if the .version file exists
  const
    options = {encoding: 'utf8'};
  appc_ver = fs.readFileSync(verFile, options); //Reading the .version file for the version
}
else{
  console.log('Did not find APPC CLI installed.');
}

//Getting the appc executable for OSX (default)
appcExe = path.join(installFolderPath, appc_ver, 'package', 'bin', 'appc');
pathPart = path.join('mobilesdk','osx');
//Getting the appc executable if platform is windows
if(platform === 'win32'){
  // appcExe =
  pathPart = path.join('mobilesdk','windows');
}

class util{

  static getSDKInfo(value){
    const sdkinfo = {
      type: NO_BRANCH,
      val: value,
      isInstalled: false
    };
    //Checking if entered value is a branch or no branch
    if(PATTERN0.test(value)){
      sdkinfo.type = BRANCH;
      sdkinfo.val = value;
    }
    return sdkinfo;
  }

  /**
  Get the sdk install path
  @param {function} done - success callback
  @param {function} fail - error callback
  @param {array} args - arguments for the command
  **/
  static getSDKInstallPath(done, fail){
    let args = ['ti', 'sdk', '-o', 'json'],
    isErr = false,
    output = '';

    args = args.concat(FLAGS);

    const
    subspawn = this.platformConvert(appcExe, args),
    spawn_prc = spawn(subspawn, args);

    spawn_prc.stdout.on('data', data => {
      output += data.toString();
    });
    spawn_prc.on('error', err => {
      isErr = true;
      fail(`Failed to get SDK install path: ${err}`);
    });
    spawn_prc.on('exit', () => {
      if (isErr){
        return;
      }

      const
      jsonOut = JSON.parse(output);
      done(jsonOut.defaultInstallLocation);
    });
  }

  /**
  Check if SDK installed
  @param {String} sdk - argument to pass
  @param {Object} sdkObj - Object obtained from getSDKInfo
  @param {String} value - Value of the SDK entered by the user
  @param {String} sdkpath - Path the SDK folder
  **/
  static isSDKInstalled(sdk){
    return new Promise((resolve, reject)=>{
      let
        sdkObj = this.getSDKInfo(sdk),
        value = sdkObj.val,
        sdkpath = '';

      if(value !== undefined){ //value will be undefined if no SDK is specifed in the command
        if(!PATTERN0.test(value)){
          new Promise((resolve, reject)=>{
            this.getSDKInstallPath(resolve, reject);
          })
          .then(installpath => {
            sdkpath = path.join(installpath, pathPart, sdk); //Check for SDK folder
            if(!fs.existsSync(sdkpath)){ //Checking if the sdk path doesn't exist
              resolve(sdkObj); /* Resolve with sdkObj = { type: NO_BRANCH, val: sdk, isInstalled: false };*/
            }
            else{
              sdkObj.isInstalled = true; //Specified sdk is installed
              resolve(sdkObj); /* Resolve with sdkObj = { type: NO_BRANCH, val: sdk, isInstalled: true };*/
            }
          });
        }
        else{
          sdkObj.type = BRANCH; //Specified sdk is a branch then change the type to BRANCH
          resolve(sdkObj);  /* Resolve with sdkObj = { type: BRANCH, val: sdk, isInstalled: false };*/
        }
      }
      else{
        reject(color.error('No SDK specified in the command.')); //Rejecting with message
      }
    });
  }

  /**
  Install the SDK
  @param {array} args - argument to pass to the spawn command
  @param {Object} sdkObj - Object obtained from getSDKInfo
  @param {Boolean} isErr - true if error
  @param {String} output - output from the spawn command
  @param {String} sdkval - Parsed sdk value from the output if sdk already exists
  **/
  static installSDK(sdkobj){
    return new Promise((resolve, reject)=>{
      let
        args = ['ti', 'sdk', 'install', '-d'],
        isErr,
        output = '',
        sdkval = '';

      const
        ver = sdkobj.val;

      if(sdkobj.type === BRANCH){
        args.push('-b', ver);   //If its a branch adding -b to the command
        args = args.concat(FLAGS);  //Concatinating the FLAGS
      }
      else{
        args.push(ver);
        args = args.concat(FLAGS);  //Concatinating the FLAGS
      }

      const
        subspawn = this.platformConvert(appcExe, args),
        spawn_prc = spawn(appcExe, args);

      spawn_prc.stdout.on('data', data => {
        output += data.toString();
      });
      spawn_prc.on('error', err => {
        isErr = true;
        reject(`Failed to install SDK ${ver}: ${err}`); //Rejecting with message
      });
      spawn_prc.on('exit', () => {
        if(isErr){
          return;
        }
      });
      spawn_prc.on('close', () => {
        //Latest is already installed
        if(PATTERN1.test(output)){
          sdkval = output.split(' ')[3];
          console.log(`Latest SDK from the branch already installed: ${sdkval}.`);
          resolve(sdkval); //Resolving with the parsed sdk value which is used further in the '.then' block in utils.js
        }
        else{
          //Installation done successfully
          if(PATTERN2.test(output)){
            console.log('Done installing SDK.');
            resolve(); //Resolve with nothing
          }
        }
      });
    });
  }

  /**
  Select the SDK in CLI
  @param {String} sdk - argument to pass
  @param {Object} sdkObj - Object obtained from getSDKInfo
  @param {array} args - argument to pass to the spawn command
  @param {Boolean} isErr - true if error
  **/
  static selectSDK(sdk){
    return new Promise((resolve, reject) => {
      if(sdk !== undefined){
        const
          sdkobj = this.getSDKInfo(sdk),
          val = sdkobj.value,
          PATTERN = /Configuration saved/g;

        let
          args = ['ti', 'sdk', 'select', sdk].concat(FLAGS),
          isErr = false;

        const
          subspawn = this.platformConvert(appcExe, args),
          spawn_prc = spawn(appcExe, args);
          spawn_prc.stdout.on('data', data => {
            if(PATTERN.test(data)){
              console.log('\u2714 Selected SDK '+sdk+' in the CLI.');
              resolve(true);    //Resolve with true so that the next then can proceed
            }
          });
          spawn_prc.on('error', () => {
            isErr = true;
            console.log('Failed to select SDK '+sdk);
            reject('fail');
          });
          spawn_prc.on('exit', () => {
            if(isErr){
              return;
            }
          });
      }
      else{
        resolve(true);    //Resolve with true so that the next then can proceed
      }
    });
  }

  /**
  Select the SDK in CLI
  @param {String} output - output converted from buffer to string
  @param {array} args - argument to pass to the spawn command
  **/
  static createProject(){
    return new Promise((resolve, reject) => {
      let
        args = ['new', '--force',
                '--name', 'CLItestApp',
                '--type', 'app',
                '--id', 'com.appc.clitestapp',
                '--platforms', 'all',
                '-d', appPath,
                '--no-services'],
        output;

      args = args.concat(FLAGS);
      console.log(args);
      const
        subspawn = this.platformConvert(appcExe, args),
        spawn_prc = spawn(appcExe, args);

      spawn_prc.stdout.on('data', data => {
        // console.log(data.toString().trim());
        output += data.toString().trim();
      });
      spawn_prc.on('exit', code => {
        if(code !== 0){
          console.log('Failed to create project.');
          reject(false);  //rejecting it with fail is app creation fails
        }
      });
      spawn_prc.on('close', () => {
        if(/new completed/g.test(output)){
          console.log('\u2714 Project created successfully.');
          resolve(true);     //Resolving with true if app created successfully
        }
      });
  });
}

static androidEmuBuild(){
  const
    platform = configData.android.emulatorbuild.platform,
    target = configData.android.emulatorbuild.target,
    deviceid = configData.android.emulatorbuild.deviceid;
  let
    args = ['run',
            '--platform', platform,
            '--target', target,
            '--device-id', deviceid,
            '--project-dir',appPath],
    output;

    args = args.concat(FLAGS);
    console.log(args);
  return new Promise((resolve, reject) => {
    const
      subspawn = this.platformConvert(appcExe, args),
      spawn_prc = spawn(appcExe, args);
    let
      pid = '';

      spawn_prc.stdout.on('data', data => {
        // console.log(data.toString().trim());
        output += data.toString().trim();
      });

      pid = spawn_prc.pid; //Getting the pid of the spawn_prc

      //There is no way I can wait till the emulator launches, installs & launches app, using setTimeout for this purpose
      setTimeout(function(){
        if(/Start application log/g.test(output)){
          console.log('\u2714 App successfully installed & launched on emulator: '+ deviceid);
          // kill(spawn_prc.pid);
          resolve(pid);  //Resolving with the pid
        }
        else{
          console.log('App failed to install & launch on emulator: '+ deviceid);
          // kill(spawn_prc.pid);
          resolve(pid);   //Rejecting with pid
        }
      }, 60000);
  });
}

static androidDeviceBuild(){
  const
    platform = configData.android.devicebuild.platform,
    target = configData.android.devicebuild.target,
    deviceid = configData.android.devicebuild.deviceid;

  let
    args = ['run',
            '--platform', platform,
            '--target', target,
            '--device-id', deviceid,
            '--project-dir',appPath],
    output;

    args = args.concat(FLAGS);
    console.log(args);
  return new Promise((resolve, reject) => {
    const
      subspawn = this.platformConvert(appcExe, args),
      spawn_prc = spawn(appcExe, args);
    let
      pid = '';

      spawn_prc.stdout.on('data', data => {
        // console.log(data.toString().trim());
        output += data.toString().trim();
      });

      pid = spawn_prc.pid; //Getting the pid of the spawn_prc
      //wait for 1 min for the app to install & launch on device then kill the process
      setTimeout(function(){
        if(/Start application log/g.test(output)){
          console.log('\u2714 App successfully installed & launched on device: '+deviceid);
          // kill(spawn_prc.pid);
          resolve(pid);  //Resolving with the pid
        }
        else{
          console.log('App failed to install & launch on device: '+deviceid);
          // kill(spawn_prc.pid);
          resolve(pid);   //Rejecting with pid
        }
      }, 60000);
  });
}

static androidPackage(){
  const
    platform = configData.android.package.platform,
    target = configData.android.package.target,
    keystore = configData.android.package.keystore,
    storepassword = configData.android.package.storepassword,
    alias = configData.android.package.alias;

  let
    args = ['run',
            '--platform', platform,
            '--target', target,
            '--keystore', keystore,
            '--store-password', storepassword,
            '--alias', alias,
            '--output-dir', genFilePath],
    output;
    args = args.concat(FLAGS);
    console.log(args);
    return new Promise((resolve, reject) => {
      //cd in to the project dir
      process.chdir(appPath);
      const
        subspawn = this.platformConvert(appcExe, args),
        spawn_prc = spawn(appcExe, args);
      let
        pid = '';

      spawn_prc.stdout.on('data', data => {
        output += data.toString().trim();
      });
      pid = spawn_prc.pid; //Getting the pid of the spawn_prc

      spawn_prc.on('exit', code => {
        console.log('code: '+code);
        if(code !== 0){
          console.log('Something went wrong while packaging. Please check the logs at :');
          reject(false);  //rejecting it with fail
        }
      });
      spawn_prc.on('close', () => {
        const
          apkexists = fs.existsSync(apkPath);

        if(/Packaging complete/g.test(output) && apkPath){  //Checking if app is packaged & the apk is present
          console.log('\u2714 App successfully packaged at: '+color.cyan(genFilePath+'/CLItestApp.apk'));
          // kill(spawn_prc.pid);
          resolve(pid);  //Resolving with the pid
        }
        else if(/ERROR/g.test(output)){
          console.log('ERROR: '+ color.error(output.split('ERROR')[1]));
          // console.log('App failed to package. Please refer the logs at: ');
          // kill(spawn_prc.pid);
          resolve(pid);   //Rejecting with pid
        }
      });
    });
}

static installAPKOnDevice(){
  let
    client, deviceid = '';

  new Promise((resolve, reject) => {
    client = adb.createClient();      //Creating a client
    client.listDevices()              //Getting the connected device info
    .then(device => {
      deviceid = device[0].id;        //Getting the device id/serial
      if(device.length === 0){
        console.log('No devices connected. Skipping installing on device.');
        resolve(false);               //If device array length is zero then resolve with false
      }
      else{
        console.log('Installing APK on the connected device.');
        return client.install(deviceid, apkPath);  //Install the apk on the device
      }
    })
    .then(() => {
      client.isInstalled(deviceid, 'com.appc.clitestapp'); //check if the app is installed on the device
    })
    .then(() => {
      console.log('APK successfully installed on the device.');
      //Start the app on the device
      return client.startActivity(deviceid, {wait: true, component: 'com.appc.clitestapp/.ClitestappActivity', action: 'MAIN', catagory: 'LAUNCHER'});
    })
    .then(result =>{
      if(result){
        console.log('App launched successfully');
        console.log('Deleting the app from the device.');
        return client.uninstall(deviceid, 'com.appc.clitestapp'); //If activity is started uninstall the app from the device
      }
      resolve(false);              //If activity did not start resolve with false
    })
    .then(result => {
      if(result){
        console.log('App deleted successfully from the device.');
        resolve(true);             //If uninstall is successfull then resolve with true
      }
    })
    .catch(err => {
      console.log(err);           //Catch & display errors if any
    });
  });
}
  /**
  Convert ChildProcess.spawn() arguments to be more cross-platform
  @param {String} cmd - the external program/process to call
  @param {Array} flags - the flags that will be passed to the external program/process
  @return {String} - returns the same program or cmd.exe
  **/
  static platformConvert(cmd, flags) {
    switch (os.platform()) {
      case 'win32':
      flags.unshift('/c', cmd);
      return 'cmd.exe';

      default: // macOS
      return cmd;
    }
  }

}
module.exports = util;
