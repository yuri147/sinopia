var fs     = require('fs')
var Path   = require('path')
var logger = require('./logger')
var _ = require('lodash');

module.exports = find_config_file

function find_config_file() {
  var paths = get_paths()

  for (var i=0; i<paths.length; i++) {
	  debugger;
    if (file_exists(paths[i].path)) return paths[i].path
  }

  create_config_file(paths[0])
  return paths[0].path
}

function create_config_file(config_path) {
  require('mkdirp').sync(Path.dirname(config_path.path))
  logger.logger.info({ file: config_path.path }, 'Creating default config file in @{file}')

  var created_config = fs.readFileSync(require.resolve('../conf/default.yaml'), 'utf8')

  if (config_path.type === 'xdg') {
    var data_dir = process.env.XDG_DATA_HOME
                || Path.join(process.env.HOME, '.local', 'share')
    if (folder_exists(data_dir)) {
      data_dir = Path.resolve(Path.join(data_dir, 'verdaccio', 'storage'))
      created_config = created_config.replace(/^storage: .\/storage$/m, 'storage: ' + data_dir)
    }
  } else {
    var data_dir = Path.resolve(Path.dirname(config_path.path), 'storage');
	created_config = created_config.replace(/^storage: .\/storage$/m, 'storage: ' + data_dir);
  }

  fs.writeFileSync(config_path.path, created_config)
}

function get_paths() {
  var try_paths = []
  if (process.env.SINOPIA_CONFIG_DIR) {
	  console.log('use SINOPIA_CONFIG_DIR as config directory: ', process.env.SINOPIA_CONFIG_DIR)
	  try_paths.push({
        path: Path.resolve(process.env.SINOPIA_CONFIG_DIR, 'config.yaml'),
        type: 'env',
      })
	  //create_config_file(try_paths[0]);
  }
  var xdg_config = process.env.XDG_CONFIG_HOME
                || process.env.HOME && Path.join(process.env.HOME, '.config')
  if (xdg_config && folder_exists(xdg_config)) {
    try_paths.push({
      path: Path.join(xdg_config, 'verdaccio', 'config.yaml'),
      type: 'xdg',
    })
  }

  if (process.platform === 'win32'
   && process.env.APPDATA
   && folder_exists(process.env.APPDATA)) {
    try_paths.push({
      path: Path.resolve(Path.join(process.env.APPDATA, 'verdaccio', 'config.yaml')),
      type: 'win',
    })
  }

  try_paths.push({
    path: Path.resolve(Path.join('.', 'verdaccio', 'config.yaml')),
    type: 'def',
  })

  // backward compatibility
  try_paths.push({
    path: Path.resolve(Path.join('.', 'config.yaml')),
    type: 'old',
  })
  return try_paths
}

function folder_exists(path) {
  try {
    var stat = fs.statSync(path)
  } catch(_) {
    return false
  }

  return stat.isDirectory()
}

function file_exists(path) {
  try {
    var stat = fs.statSync(path)
  } catch(_) {
    return false
  }

  return stat.isFile()
}
