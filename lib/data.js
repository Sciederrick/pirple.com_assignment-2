/*
*Library for storing and editing data: @create_file, @read_file, @update_file, @list_file
*
*/

// Dependencies
const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

// Container for the module (to be exported)
const lib = {}

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// @create_file: Write data to a file
lib.create = (dir, file, data, callback)=>{
 // Open the file for writing
 fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor)=>{
   if(!err && fileDescriptor){
     // Convert data to string
     const stringData = JSON.stringify(data)

     // Write to file and close it
     fs.writeFile(fileDescriptor, stringData, (err)=>{
       if(!err){
         fs.close(fileDescriptor, (err)=>{
           if(!err){
             callback(false)
           }else{
             callback('Error closing new file')
           }
         })
       }else{
         callback('Error writing to new file')
       }
     })
   }else{
     callback('Could not create new file, it may already exist')
   }
 })
}

// @read_file: Read data from a file
lib.read = (dir, file, callback)=>{
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data)=>{
    if(!err && data){
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    }else{
      callback(err, data)
    }
  })

}

// @update_file: Update data inside a file
lib.update = (dir, file, data, callback)=>{
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor)=>{
    if(!err && fileDescriptor){
      // Convert data to string
      const stringData = JSON.stringify(data)

      // Truncate the file
      fs.truncate(fileDescriptor, (err)=>{
        if(!err){
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, (err)=>{
            if(!err){
              fs.close(fileDescriptor, (err)=>{
                if(!err){
                  callback(false)
                }else{
                  callback('Error closing existing file')
                }
              })
            }else{
              callback('Error writing to existing file')
            }
          })
        }else{
          callback('Error truncating file')
        }
      })
    }else{
      callback('Could not open the file for updating, it may not exist yet')
    }
  })
}

// @delete_file: Delete a file
lib.delete = (dir, file, callback)=>{
  // Unlink the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err)=>{
    if(!err){
      callback(false)
    }else{
      callback('Error deleting file')
    }
  })
}

//  @list_files: List all the items in a directory
lib.list = (dir, callback)=>{
  fs.readdir(lib.baseDir+dir+'/', (err, data)=>{
    if(!err && data && data.length > 0){
      let trimmedFileNames = []
      data.forEach((fileName)=>{
        trimmedFileNames.push(fileName.replace('.json',''))
      })
      callback(false, trimmedFileNames)
    }else{
      callback(err, data)
    }
  })
}

//  @mkdir: Create a directory
lib.mkdir = (dir, callback)=>{
  fs.mkdir(lib.baseDir + dir, (err)=>{
    if(!err){
      callback(false)
    }else{
      callback(err)
    }
  })
}

//  @rm: Remove a directory and all of its contents
lib.rm = (dir, callback)=>{
  fs.rmdir(lib.baseDir + dir, {recursive:true}, (err)=>{
    if(!err){
      callback(false)
    }else{
      callback(err)
    }
  })
}

// Export the module
module.exports = lib
