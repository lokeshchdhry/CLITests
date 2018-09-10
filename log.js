'use strict';

const path = require('path'),
      fs = require('fs-extra'),
      color = require('./colors');

let
  logdate = new Date(),
  filename = logdate+'.txt';

module.exports = {appCreate_Log: function(data){
    // const
      // app_create_log_path = path.join(__dirname,'logs','appcreate');
      // app_create_log_path = fs.ensureFileSync(path.join(__dirname,'logs','appcreate', filename.trim()));
    try{fs.appendFileSync(path.join(__dirname,'logs','appcreate', filename.trim()), data);
      // fs.closeSync(3);
    }
    catch(e){console.log(color.error('Cannot write file: '+e));
    }
  },

  androidEmu_Log: function(data){
    // const
    //   a_emu_log_path = fs.ensureFileSync(path.join(__dirname,'logs','android','emulator_build', filename.trim()));
    try{fs.appendFileSync(path.join(__dirname,'logs','android','emulator_build', filename.trim()), data);
    }
    catch(e){console.log('Cannot write file: '+e);
    }
  },

  androidDevice_Log: function(data){
    // const
    //   a_device_log_path = fs.ensureFileSync(path.join(__dirname,'logs','android','device_build', filename.trim()));
    try{fs.appendFileSync(path.join(__dirname,'logs','android','device_build', filename.trim()), data);
    }
    catch(e){console.log('Cannot write file: '+e);
    }
  },

  androidGeny_Log: function(data){
    // const
    //   a_geny_log_path = fs.ensureFileSync(path.join(__dirname,'logs','android','geny_build', filename.trim()));
    try{fs.appendFileSync(path.join(__dirname,'logs','android','geny_build', filename.trim()), data);
    }
    catch(e){console.log('Cannot write file: '+e);
    }
  },

  androidPkg_Log: function(data){
    // const
    //   a_pkg_log_path = fs.ensureFileSync(path.join(__dirname,'logs','android','packaging', filename.trim()));
    try{fs.appendFileSync(path.join(__dirname,'logs','android','packaging', filename.trim()), data);
    }
    catch(e){console.log('Cannot write file: '+e);
    }
  },

  iosSim_Log: function(data){
    const
      i_sim_log_path = path.join(__dirname,'logs','simulator_build', filename);
    fs.writeFileSync(i_sim_log_path, data);
  },

  iosDevice_Log: function(data){
    const
      i_device_log_path = path.join(__dirname,'logs','device_build', filename);
    fs.writeFileSync(i_device_log_path, data);
  },

  iosPkg_Log: function(data){
    const
      i_pkg_log_path = path.join(__dirname,'logs','package_adhoc', filename);
    fs.writeFileSync(i_pkg_log_path, data);
  }
};

// }
// class log{//   constructor(){
//     const
//       date = this.Date(),
//       filename = date+'.txt',
//       app_create_log_path = path.join(__dirname,'logs','appcreate'),
//       a_emu_log_path = path.join(__dirname,'logs','emulator_build'),
//       a_device_log_path = path.join(__dirname,'logs','device_build'),
//       a_geny_log_path = path.join(__dirname,'logs','geny_build'),
//       a_pkg_log_path = path.join(__dirname,'logs','packaging'),
//       i_sim_log_path = path.join(__dirname,'logs','simulator_build'),
//       i_device_log_path = path.join(__dirname,'logs','device_build'),
//       i_pkg_log_path = path.join(__dirname,'logs','package_adhoc');
//
//     // this.createFile(path.join(app_create_log_path, filename));
//     // this.createFile(path.join(a_emu_log_path, filename));
//     // this.createFile(path.join(a_device_log_path, filename));
//     // this.createFile(path.join(a_geny_log_path, filename));
//     // this.createFile(path.join(a_pkg_log_path, filename));
//     // this.createFile(path.join(i_sim_log_path, filename));
//     // this.createFile(path.join(i_device_log_path, filename));
//     // this.createFile(path.join(i_pkg_log_path, filename));
//   }
//
//   static writeLog(tasktype, data){//     switch(tasktype){//       case'app-create':
//         fs.writeFileSync(path.join(this.app_create_log_path, this.filename), data);
//       break;
//       case 'a-emu':
//         fs.writeFileSync(this.a_emu_log_path, data);
//       break;
//       case 'a-device':
//         fs.writeFileSync(this.a_device_log_path, data);
//       break;
//       case 'a-geny':
//         fs.writeFileSync(this.a_geny_log_path, data);
//       break;
//       case 'a-pkg':
//         fs.writeFileSync(this.a_pkg_log_path, data);
//       break;
//       case 'i-sim':
//         fs.writeFileSync(this.i_sim_log_path, data);
//       break;
//       case 'i-device':
//         fs.writeFileSync(this.i_device_log_path, data);
//       break;
//       case 'i-pkg':
//         fs.writeFileSync(this.i_pkg_log_path, data);
//       break;
//       default:
//         console.log('Invalid log option provided.');
//       break;
//     }
//   }
//
//   static createFile(path){//     fs.writeFileSync(path);
//   }

// function Date(){//   var date = new Date();
//   var hour = date.getHours();
//   hour = (hour < 10 ?"0":"") + hour;
//
//   var min  = date.getMinutes();
//   min = (min < 10 ?"0":"") + min;
//
//   var sec  = date.getSeconds();
//   sec = (sec < 10 ?"0":"") + sec;
//
//   var year = date.getFullYear();
//   var month = date.getMonth() + 1;
//   month = (month < 10 ?"0":"") + month;
//   var day  = date.getDate();
//   day = (day < 10 ?"0":"") + day;
//
//   var currDate = "Date:"+year + "/" + month + "/" + day + "Time:" + hour + ":" + min + ":" + sec;
//   return (currDate);
// }
