const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the build directory
app.use('/test',express.static(path.join(__dirname, 'build')));
// app.use(express.static(path.join('/home/ibsanju/Documents/github/ibs-notes/build/')));

// Any other routes or middleware...

// Start the server
app.listen(8085, () => {
  console.log('Server started on port http://localhost:8085');
});