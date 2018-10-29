const fs = require('fs');
const yaml = require('js-yaml');

/***
 * This program creates just a txt-file to extract ID, name, process
 * and every distinct event for the purpose comparison.
 ***/

fs.readdir(__dirname, (err, files) => {
    var stream = fs.createWriteStream("processes.txt", { flags: 'a' });

    files.forEach(file => {
        var distinct = {};
        if (file.includes('.yaml')) {
            var doc = yaml.safeLoadAll(fs.readFileSync((file)));
            stream.write("---\nroot\n" + JSON.stringify(doc[0].log.trace));

            distinct[doc[0].log.trace["concept:name"]] = [];
            doc.forEach(pos => {
                if ((pos.event && !(distinct[doc[0].log.trace["concept:name"]].includes(pos.event["concept:name"]))) && pos.event["id:id"] != "external") {
                    distinct[doc[0].log.trace["concept:name"]].push(pos.event["concept:name"]);
                }
            })
            stream.write("\n=> " + JSON.stringify(distinct[doc[0].log.trace["concept:name"]]));
        }
        else if (file.includes('part')) {
            fs.readdir((__dirname + '/' + file), (err, files2) => {
                stream.write("\n---\n" + file);
                files2.forEach(file2 => {
                    if (file2.toString().includes('.yaml')) {
                        var doc = yaml.safeLoadAll(fs.readFileSync((file + '\\' + file2)));
                        stream.write("\n" + JSON.stringify(doc[0].log.trace));

                        var temp = doc[0].log.trace["concept:name"];

                        distinct[temp] = [];
                        doc.forEach(pos => {
                            if ((pos.event && !(distinct[temp].includes(pos.event["concept:name"]))) && pos.event["id:id"] != "external") {
                                distinct[temp].push(pos.event["concept:name"]);
                            }
                        })
                        stream.write("\n=> " + JSON.stringify(distinct[temp]));
                    }
                })
                //console.log(distinct);
            })
        }
    });
})
