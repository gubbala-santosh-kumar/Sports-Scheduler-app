const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { Sports, Sessions } = require('./models');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Render the admin page with sports and sessions data
app.get('/adminPage', async (req, res) => {
    try {
        // Fetch all sports and sessions from the database
        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

        // Render the admin page and pass the sports and sessions data
        res.render('adminPage', {
            sports: allSports.map(sport => sport.name),
            sessions: allSessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/adminPage', async (req, res) => {
    console.log(req.body);
    try {
        const sportName = req.body.sport.trim(); // Trim the input to remove extra spaces
        if (sportName) {
            // Check if the sport already exists
            const [sport, created] = await Sports.findOrCreate({
                where: { name: sportName }
            });

            // 'created' will be true if a new sport was added, false if it already existed
            if (!created) {
                console.log(`Sport "${sportName}" already exists.`);
            }
        }

        // Fetch all sports and sessions from the database
        const allSports = await Sports.findAll(); // Changed to findAll
        const allSessions = await Sessions.findAll(); // Add this line to fetch sessions

        // Render the admin page and pass the sports and sessions data
        res.render('adminPage', {
            sports: allSports.map(sport => sport.name),
            sessions: allSessions // Pass sessions data to the template
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Handle the DELETE request for deleting a sport
app.delete('/adminPage/:sportName', async (req, res) => {
    try {
        const sportName = req.params.sportName;
        
        // Find and delete the sport from the database
        const sportToDelete = await Sports.findOne({ where: { name: sportName } });
        if (!sportToDelete) {
            return res.status(404).send('Sport not found');
        }

        await sportToDelete.destroy(); // Delete the sport from the database

        // Return the updated sports list
        const allSports = await Sports.findAll();
        res.json(allSports.map(sport => sport.name)); // Send the updated list
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting sport');
    }
});

// Handle the POST request to create a new session
app.post('/create-session', async (req, res) => {
    try {
        const { sport, teamA, teamASize, teamB, teamBSize, actualSize, place, date, time } = req.body;

        // Validate that team sizes are integers
        if (!Number.isInteger(parseInt(teamASize)) || !Number.isInteger(parseInt(teamBSize)) || !Number.isInteger(parseInt(actualSize))) {
            return res.status(400).json({ error: 'Team sizes must be integers.' });
        }

        // Create the session
        const session = await Sessions.create({
            sport,
            teamA,
            teamASize: parseInt(teamASize),
            teamB,
            teamBSize: parseInt(teamBSize),
            actualSize: parseInt(actualSize),
            place,
            date,
            time
        });

        res.status(200).json({ message: 'Session created successfully!', session });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while creating the session.' });
    }
});


// Handle the DELETE request for deleting a session
app.delete('/delete-session/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;

        // Find and delete the session from the database
        const sessionToDelete = await Sessions.findByPk(sessionId);
        if (!sessionToDelete) {
            return res.status(404).send('Session not found');
        }

        await sessionToDelete.destroy(); // Delete the session

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting session');
    }
});

// Start the server
app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});
