Module['preInit'] = function() {

    FS.mkdir('._');
    FS.mount(WORKERFS, {
        // Array of {name,data} object where data is actual blob
        blobs : Module['blobs'],
        // Array of File objects or FileList
        files : Module['files']

    }, '._');

    Module["arguments"] = ['--noout', '--stream'];

    var i, xmlFiles = [];

    if ('[object Array]' === Object.prototype.toString.call(Module['blobs'])) {
        for (i = 0; i < Module['blobs'].length; i++) {
            var blobDescriptor = Module['blobs'][i];
            if ('.xml' === blobDescriptor.name.slice(-4)) {
                xmlFiles.push('._/' + blobDescriptor.name);
            } else {
                Module["arguments"].push('--schema');
                Module["arguments"].push('._/' + blobDescriptor.name);
            }
        }
    }

    if ('[object Array]' === Object.prototype.toString.call(Module['files'])) {
        for (i = 0; i < Module['files'].length; i++) {
            var file = Module['files'][i];
            if ('.xml' === file.name.slice(-4)) {
                xmlFiles.push('._/' + file.name);
            } else {
                Module["arguments"].push('--schema');
                Module["arguments"].push('._/' + file.name);
            }
        }
    }

    Module["arguments"] = Module["arguments"].concat(xmlFiles);

    Module['return'] = '';

    Module['stdout'] = Module['stderr'] = function(code) {
        character = String.fromCharCode(code);
        Module['return'] += character;
        if ('\n' === character) {
            postMessage(Module['return']);
            Module['return'] = '';
        }

    };
};
