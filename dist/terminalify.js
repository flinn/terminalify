(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(window, undefined) {  
    var options,
    defaultDirs = ['home','about','contact'], 
    defaults = {
        user: "Vistor:~ guest$ ",
        autorun: "WHOIS flinn",
        commands: {
            'whoami': ['guest'],
            'cd': ['-bash: cd: No such file or directory'],
            'whois flinn': ["Registrant Name: Matthew Claiborne Flinn","Registrant Organization: The Motley Fool","Registrant Title: Software Developer", "Registrant City: Arlington, VA","Last update of WHOIS database: 2014-05-06T01:00:00Z"],
            'help': ['The following shell commands are defined internally...', 'whois flinn', 'whoami', 'ls', 'cd', 'Type `help [command]` for more information about a command.']
        },
        dirs: defaultDirs,
        hesitate: 500,
        lastLogin: "Thu May 24 12:18:16",
        maxStrokeInterval: 150,
        audio: true,
        languageUsed: 'bash',
        outputInterval: 100
    },
    user,
    cursor,
    lastInput,
    lastLogin,
    typingAudio,
    keypressAudio,
    userActivated = false,
    tWindow;

    var storage = require('./storage');

    terminalify = function(selector, options) {
        return new terminalify.fn.init(selector, options);
    };

    terminalify.fn = terminalify.prototype = {
        constructor: terminalify,
        init: function(selector, options) {
            if (!selector) throw "You must have a selector!"
            if (!options) {
                options = defaults;
            }
            setupInitialView(selector, options);
            bindEventListeners(selector, options);
            if (options.autorun && options.hesitate) {
                hesitateThenTypeCommand(options);
            };
        }
    };

    function getLastCommand(upCnt) {
        return storage.getLast('commands', upCnt);
    }

    function saveLastCommand(lastCmd) {
        console.log("Saving the command :: ", lastCmd);
        storage.save('commands', lastCmd);
    }

    function hesitateThenTypeCommand(options) {
        setTimeout(function() {             
                appendEachLetterOfCommand(options);
        }, options.hesitate);
    }

    function bindEventListeners(selector, options) {
        $("#exit").click(function() {
            $('#terminal-window').remove();
            if (options.audio) {
                typingAudio.pause();
                typingAudio = undefined;
                keypressAudio = undefined;                
            }
        });

        $("#minimize").click(function() {
            $('#terminal-window').addClass('terminal-minimized');
        });

        $("#maximize").click(function() {
            $('#terminal-window').removeClass('terminal-minimized');
        });

        $("#terminal-window").click(function() {
            userActivated = true;            
            $("#terminalCommand").focus();
        });
        var count = 0;
        var lastKey = null;
        $("#terminalCommand").keyup(function(evt) {
            if (options.audio) {
                playKeypressAudio();
            }
            if (evt.keyCode == 38) {
                if (lastKey == 'down') {
                    if (count > 0) {
                        count--;
                    }
                }
                lastKey = 'up';
                console.log("Count = ", count);   
                var last = getLastCommand(count);
                $('#terminalCommand').val(last);
                count++;
            }
            if (evt.keyCode == 40) {
                if (lastKey == 'up') {
                    count--;
                }
                lastKey = 'down';
                if (count == 0) {
                    $('#terminalCommand').val('');
                } else {
                    count--;
                    console.log("Count = ", count);
                    var last = getLastCommand(count);
                    $('#terminalCommand').val(last);
                }
            }
            showUserCommandInTerminal($(this).val());
        });
        $("#usercommand").submit(function(event) {
            count = 0;
            console.log("Count = ", count);
            event.preventDefault();
            var command = $("#terminalCommand").val();
            saveLastCommand(command);
            $("#terminalCommand").val('');
            //resetLastInput(options.user);
            $("#last-input").css('visibility','hidden');

            attemptExecutingCommand(options, command);
        });
    }

    function navigateTo(target) {
        if (target == 'home') {
            console.log("location == ", window.location);
            window.location.href = 'http://0.0.0.0:8080/'
        } else {
            window.location.href = 'http://0.0.0.0:8080/' + target;
        }
    }

    function attemptExecutingCommand(options, command) {
        //show the command in the terminal
        $("#last-input").before(createTerminalLine(options.user, command));
        var cmd = command.toLowerCase();
        if (cmd == 'ls') {
            console.log("Trying to list folders/files with ls cmd...");
            writeOutput(options, options.dirs, resetLastInput);
            return;
        } 
        if (cmd.indexOf('cd') == 0) {
            var target = cmd.split(' ');
            console.log("CD target == ", target);
            if (target.length == 1 || options.dirs.indexOf(target[1]) == -1) {
                writeOutput(options, ['-bash: cd: No such file or directory'], resetLastInput);
            } else {
                var current = window.location.pathname;
                console.log('Current HREF == ', current);
                navigateTo(target[1]);
            }
            return;
        } 
        if (options.commands[cmd]) {
            console.log("Normal command == ", cmd);           
            writeOutput(options, options.commands[cmd], resetLastInput);
            return;
        } else {
            if (command == '') {
                writeOutput(options, [''], resetLastInput);
            } else {
                writeOutput(options, ['-bash: ' + command + ': command not found'], resetLastInput);
            }
        }        
    }

    function showUserCommandInTerminal(newValue) {
        if ($('#terminal-cursor').prev().hasClass('user')) {
            $('#terminal-cursor').before('<span class="input"></span>');
        }
        var currentCommand = $('#terminal-cursor').prev();
        currentCommand.text(newValue);
    }

    function setupInitialView(selector, options) {
        var display = require('./temp.json').window;
        $('#terminal-window').html(display);        
        $('#terminal-language').text(options.languageUsed);
        $('#terminal-lastlogin').text(options.lastLogin + ' on ttys001');
        $('#terminal-user').text(options.user);
        $('#terminal-window').toggleClass('terminal-hidden');
    }

    terminalify.fn.init.prototype = terminalify.fn;

    function resetLastInput(user) {
        $('#terminal-cursor').appendTo('#terminal-hidden');
        var lastInputHtml = '<span class="user">' + String(user) + '</span>';
        $("#last-input").html(lastInputHtml);
        setTimeout(function() {
            $("#last-input").append($('#terminal-cursor'));
            $('#terminal-cursor').css('visibility','visible');
            $("#last-input").css('visibility','visible');
            scrollTerminalDown();
            $("#terminalCommand").focus();
        }, 300);        
    }

    function createTerminalLine(user, text) {
        var textOutput = '<p>{0}<span class="input">{1}</span></p>';
        if (user) {
            textOutput = textOutput.replace('{0}', '<span class="user">' + user + '</span>');
        } else {
            textOutput = textOutput.replace('{0}', '');
        }
        textOutput = textOutput.replace('{1}', text);
        return textOutput;
    }

    function scrollTerminalDown() {
        var tbody = document.getElementById('terminal-body');
        tbody.scrollTop = tbody.scrollHeight;
    }

    function writeOutput(options, outputs, callback) {
        if (outputs) {
            options.output = outputs;
        }
        $('#terminal-cursor').css('visibility','hidden');
        var i = 0, cycle = 0;
        var outputIntervalId = setInterval(function() {
            if (options.output[i]) {
                var textOutput = createTerminalLine(null, options.output[i]);            
                $("#last-input").before(textOutput);            
            }
            if (cycle == options.output.length + 1) {
                clearInterval(outputIntervalId);
                callback(options.user);
            }
            scrollTerminalDown();
            cycle = cycle + 1;
            i++;
        }, options.outputInterval);
    }

    function playTypingAudio(audio) {
        var audioAsset = typeof audio == "boolean" ? 'typing.mp3' : audio;
        typingAudio = new Audio(audioAsset);
        typingAudio.play();
    }

    function playKeypressAudio() {
        keypressAudio = new Audio('keypress.mp3');
        keypressAudio.play();
    }

    function appendEachLetterOfCommand(options) {

        if (options.audio) {            
            playTypingAudio(options.audio);
        }

        var i = 0, intervalId, writtenChars = "";
        intervalId = window.setInterval(function() {
            writtenChars += String(options.autorun).charAt(i++);
            $("#terminalify-command").text(writtenChars);
            if (i > options.autorun.length) {
                window.clearInterval(intervalId);
                if (options.audio) {
                    typingAudio.pause();
                }
                writeOutput(options, options.commands[options.autorun.toLowerCase()], resetLastInput);
            }
        }, options.maxStrokeInterval);
    };  

    if ( typeof module === "object" && typeof module.exports === "object" ) {       
        module.exports = terminalify;
    } 
    if ( typeof window === "object" && typeof window.document === "object" ) {
        window.terminalify = terminalify;
    }
})(window);
},{"./storage":2,"./temp.json":3}],2:[function(require,module,exports){
var save = function(key, cmd) {

	var ls = window.localStorage;
	var obj = ls['terminalify'];
	var db;

	if (typeof obj == 'undefined') {
		db = {};
		db[key] = [];
	} else {
		db = JSON.parse(obj);
		console.log("Parsed the db from LS object");
	}

	console.log("Got terminalify DB... ", db);

	if (db[key].length >= 30) {
		var dropped = db[key].shift();
		console.log("Dropping oldest command...", dropped);
	}

	db[key].push(cmd);
	ls.setItem('terminalify', JSON.stringify(db));
}

var last = function(key, upCount) {

	if (upCount > 18) {
		upCount = 18;
	}

	var ls = window.localStorage;
	var obj = ls['terminalify'];
	var db;

	if (typeof obj == 'undefined') {
		return '';
	} else {
		db = JSON.parse(obj);
		var list = db[key];
		return list[list.length - 1 - upCount];
	}
}

module.exports = {
	save: save,
	getLast: last
}
},{}],3:[function(require,module,exports){
module.exports={"window":"<div id=\"terminal-toolbar\">\n    <div class=\"top\">\n        <div id=\"lights\">\n            <div id=\"exit\" class=\"light red\">\n                <div class=\"glyph\"><span class=\"btnExit\">&#10006;</span>\n                </div>\n                <div class=\"shine\"></div>\n                <div class=\"glow\"></div>\n            </div>\n            <div id=\"minimize\" class=\"light yellow\">\n                <div class=\"glyph\"><span class=\"btnMin\">-</span>\n                </div>\n                <div class=\"shine\"></div>\n                <div class=\"glow\"></div>\n            </div>\n            <div id=\"maximize\" class=\"light green\">\n                <div class=\"glyph\"><span class=\"btnMax\">+</span>\n                </div>\n                <div class=\"shine\"></div>\n                <div class=\"glow\"></div>\n            </div>\n        </div>\n        <div id=\"title\">\n            <div class=\"folder\">\n                <div class=\"tab\"></div>\n                <div class=\"folder-body\"></div>\n            </div>1. Terminal (<span id=\"terminal-language\"></span>)</div>\n        <div id=\"bubble\">\n            <div class=\"shine\"></div>\n            <div class=\"glow\"></div>\n        </div>\n    </div>\n</div>\n<div id=\"terminal-body\" class=\"terminal\">\n    <p>Last login: <span id=\"terminal-lastlogin\"></span></p>\n    <p><span id=\"terminal-user\" class=\"user\"></span><span id=\"terminalify-command\" class=\"input\"></span><span id=\"terminal-cursor\" class=\"cursor\"></span>\n    </p>\n    <p id=\"last-input\"></p>\n</div>\n<div id=\"terminal-hidden\">\n\t<form id=\"usercommand\" action=\"\">\n          <input type=\"text\" id=\"terminalCommand\" name=\"terminalCommand\" autocomplete=\"off\">\n          <input type=\"submit\" value=\"Submit\" >\n    </form>\n</div>\n\n"}
},{}]},{},[1]);
