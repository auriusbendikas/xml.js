/**
 * Implementing Module.preInit() to be executed just before module gets executed.
 */
Module['preInit'] = function() {

    /**
     * Overrides the slice method of the Blob to capture and send progress information while the file being read.
     *
     * @param {Blob} blob - The blob to override slice method on.
     * @param {string} name - The name of the blob for displaying purposes of progress.
     */
    function registerProgressNotifications(blob, name) {
        blob.oldSlice = blob.slice;
        blob.percent = 0;
        blob.bytesRead = 0;
        blob.slice = function(start, end, contentType) {
            var blobSlice = this.oldSlice(start, end, contentType);
            this.bytesRead += blobSlice.size;
            var currentPercent = Math.floor(this.bytesRead / this.size * 100);
            if (currentPercent > this.percent) {
                this.percent = currentPercent;
                postMessage({
                    type : 'progress',
                    percent : this.percent,
                    name : name
                });
            }
            return blobSlice;
        };
    }

    var folderName = '.__delete_me__/';
    FS.mkdir(folderName.slice(0, -1));
    FS.mount(WORKERFS, {
        // Array of {name,data} object where data is actual blob
        blobs : Module['blobs'],
        // Array of File objects or FileList
        files : Module['files']

    }, folderName);

    Module["arguments"] = ['--noout', '--stream'];

    var i, xmlFiles = [];

    if ('[object Array]' === Object.prototype.toString.call(Module['blobs'])) {
        for (i = 0; i < Module['blobs'].length; i++) {
            var blob = Module['blobs'][i];
            if ('application/xml' === blob.type) {
                var blobName = 'blob-' + i + '.xml';
                registerProgressNotifications(blob, blobName);
                xmlFiles.push(folderName + blobName);
            } else
                if ('application/schema+xml' === blob.type) {
                    Module["arguments"].push('--schema');
                    Module["arguments"].push(folderName + 'blob-' + i + '.xsd');
                }
        }
    }

    if ('[object Array]' === Object.prototype.toString.call(Module['files'])) {
        for (i = 0; i < Module['files'].length; i++) {
            var file = Module['files'][i];
            if ('.xml' === file.name.slice(-4)) {
                registerProgressNotifications(file, file.name);
                xmlFiles.push(folderName + file.name);
            } else {
                Module["arguments"].push('--schema');
                Module["arguments"].push(folderName + file.name);
            }
        }
    }

    Module["arguments"] = Module["arguments"].concat(xmlFiles);

    /**
     * Sends worker notification module has logged a line in the output
     */
    var outputLine = '';

    Module['stdout'] = Module['stderr'] = function(code) {
        character = String.fromCharCode(code);
        outputLine += character;
        if ('\n' === character) {
            postMessage({
                type : 'log',
                line : outputLine.replace(folderName, '')
            });
            outputLine = '';
        }
    };

    /**
     * Sends worker notification that module has ended execution with exit status
     */
    Module['onExit'] = function(status) {
        postMessage({
            type : 'exit',
            status : status
        });
    };
};
