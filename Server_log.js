// const express = require('express');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const path = require('path');
// const morgan = require('morgan');
// const helmet = require('helmet');
// const cors = require('cors');
// const compression = require('compression');
// const cookieParser = require('cookie-parser');
// const pageRoutes = require('./routes/pageRoutes');
// const authRoutes = require('./routes/authRoutes');
// const patientRoutes = require('./routes/patientRoutes');
// const sahayakRoutes = require('./routes/sahayakRoutes');
// const logger = require('./middlewares/logger');
// const errorHandler = require('./middlewares/error_handler');

// // Server port
// const PORT = 3000;

// // Create an Express app
// const app = express(); 
// app.use(logger);
// // Use helmet to secure HTTP headers
// // app.use(helmet()); // middleware 1

// // Use morgan for logging requests
// app.use(morgan('combined')); // middleware 2       // To Log HTTP requests
// app.use(morgan('dev')); // middleware 2            // To Give Colour To Status Code

// // Use cors to enable Cross-Origin Resource Sharing
// app.use(cors())   // middleware 3   // allow backend request from all frontend urls- Cross-Origin Resource Sharing

// // Use compression to compress response bodies
// app.use(compression()); // middleware 4

// // Use body-parser middleware to parse JSON requests
// app.use(bodyParser.json()); //middleware 6

// // Set EJS as the view engine
// app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// app.use(express.urlencoded({ extended: true }));

// // Use authentication routes
// app.use(authRoutes);

// // Use page routes
// app.use(pageRoutes);

// // Use patient data routes
// app.use(patientRoutes);

// // Use sahayak routes
// app.use(sahayakRoutes);

// app.use(errorHandler);

// // Error-handling middleware
// // app.use((err, req, res, next) => {
// //     console.error(err.stack); // Log the error stack
// //     res.status(500).json({ error: 'Something went wrong!' });
// // });

// // Start the server
// app.listen(PORT, () => {
//     console.log("server is running on port");
//     console.log(`http://localhost:${PORT}/`);
// });