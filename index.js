const { SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG } = require('constants');
const http = require('http');
const fileSystem = require('fs');

const hostname = '0.0.0.0';
const port = 26843; // vanity number for "covid"

values = {};

const server = http.createServer((req, res) => {
  if (req.method == "GET") {
    let id = req.url.substr(1);

    if (id == "incidence") {
      const filePath = '/files/output.tar.gz';
      if (fileSystem.existsSync(filePath)) {
        var stat = fileSystem.statSync(filePath);
        res.writeHead(200, {
            'Content-Type': 'application/gzip',
            'Content-Length': stat.size
        });

        var readStream = fileSystem.createReadStream(filePath);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
      } else {
        res.statusCode = 500;
        res.end("500 - Incidence data not ready. Please try again later. In the worst case, it might take 5 hours until data is ready.");
      }
    } else if (id.length >= 16 && values.hasOwnProperty(id)) {
      const value = values[id];
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/binary');
      res.end(value);
      console.log("Retreived " + id);
    } else {
      res.statusCode = 404;
      res.end("404 - Id not found");
      console.log("Invalid or unknown id " + id);
    }
  } else if (req.method == "POST") {
    let id = req.url.substr(1);
    if (id.length >= 16) {
      let data = Buffer.alloc(0);
      req.on('data', chunk => {
        console.log("Got chunk of length " + chunk.length);
        data = Buffer.concat([data, chunk]);
        console.log("Data now has length " + data.length);
      })
      req.on('end', () => {
        if (data.length == 256) {
          values[id] = data;
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end("OK");
          console.log("Saved " + id);
        } else {
          res.statusCode = 400;
          res.end("400 - Value not valid");
          console.log("Invalid value " + id + " with length " + data.length);
        }
      })
      
    } else {
      res.statusCode = 400;
      res.end("400 - Id not valid");
      console.log("Invalid id " + id);
    }
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


// Taken from https://medium.com/@becintec/building-graceful-node-applications-in-docker-4d2cd4d5d392

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};// Do any necessary shutdown logic for our application here

const shutdown = (signal, value) => {
  console.log("shutdown!");
  server.close(() => {
    console.log(`server stopped by ${signal} with value ${value}`);
    process.exit(128 + value);
  });
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});