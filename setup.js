'use strict';

const storage = require('node-persist'),
inquirer = require('inquirer'),
os = require('os');

module.exports = function(flag) {
  return new Promise(resolve => {

    let runcount = '', //count to keep a track if setup was run atleast once
        OS = '';

    if (flag) {
      storage.initSync();
      runcount = storage.getItemSync('runcount');
      if (runcount === (0 || undefined)) {
        // runSetup();
        //checking if OS is windows
        if (os.platform === 'win32') {
          OS = 'windows';
        }
        OS = 'osx';
        console.log('It seems you have not run setup atleast once. Running setup .....');
        inquirer.prompt({
          type: 'input',
          name: 'androidkeyPath',
          message: 'Please enter the path for android keystore.'
        }).then(answers=>{
          storage.setItemSync(OS, answers.androidkeyPath);
          storage.setItemSync('runcount', 1);
          console.log('Android keystore stored successfully.');
          resolve('success');
        });
      } else {
        // console.log('Setup seems to be already run, skipping.');
        resolve('Setup seems to be already run, skipping.');
      }
    }
  });
};
