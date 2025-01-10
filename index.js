const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { Sports, Sessions } = require('./models');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/adminPage', async (req, res) => {
    try {
        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

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
        const sportName = req.body.sport.trim();
        if (sportName) {
            const [sport, created] = await Sports.findOrCreate({
                where: { name: sportName }
            });

            if (!created) {
                console.log(`Sport "${sportName}" already exists.`);
            }
        }

        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

        res.render('adminPage', {
            sports: allSports.map(sport => sport.name),
            sessions: allSessions
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/adminPage/:sportName', async (req, res) => {
    try {
        const sportName = req.params.sportName;

        const sportToDelete = await Sports.findOne({ where: { name: sportName } });
        if (!sportToDelete) {
            return res.status(404).send('Sport not found');
        }

        await sportToDelete.destroy();

        const allSports = await Sports.findAll();
        res.json(allSports.map(sport => sport.name));
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting sport');
    }
});

app.get('updateSessionForm', async (req, res) => {
    try {
        const allSports = await Sports.findAll();
        const session = await Sessions.findAll();

        res.render('playerPage', {
            sports: allSports.map(sport => sport.name),
            session: session
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/create-session', async (req, res) => {
    try {
        const { sport, teamA, teamASize, teamB, teamBSize, actualSize, place, date, time } = req.body;

        if (!Number.isInteger(parseInt(teamASize)) || !Number.isInteger(parseInt(teamBSize)) || !Number.isInteger(parseInt(actualSize))) {
            return res.status(400).json({ error: 'Team sizes must be integers.' });
        }

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

app.delete('/delete-session/:sessionId', async (req, res) => {
    try {
        const sessionId = req.params.sessionId;

        const sessionToDelete = await Sessions.findByPk(sessionId);
        if (!sessionToDelete) {
            return res.status(404).send('Session not found');
        }

        await sessionToDelete.destroy();

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting session');
    }
});

app.post('/update-session', async (req, res) => {
    const { sessionId, sport, teamA, teamASize, teamB, teamBSize, actualSize, place, date, time } = req.body;

    console.log(req.body);

    const parsedTeamASize = parseInt(teamASize);
    const parsedTeamBSize = parseInt(teamBSize);
    const parsedActualSize = parseInt(actualSize);

    console.log('Parsed values:', {
        parsedTeamASize,
        parsedTeamBSize,
        parsedActualSize
    });

    if (isNaN(parsedTeamASize) || isNaN(parsedTeamBSize) || isNaN(parsedActualSize)) {
        return res.status(400).json({ error: 'Team sizes must be valid integers.' });
    }

    const sessionData = {
        sport,
        teamA,
        teamAsize: parsedTeamASize,
        teamB,
        teamBsize: parsedTeamBSize,
        actualTeamSize: parsedActualSize,
        place,
        date: new Date(date),
        time
    };

    try {
        const result = await Sessions.updateSession(sessionId, sessionData);

        if (result.success) {
            return res.status(200).json({ message: result.message });
        } else {
            return res.status(404).json({ message: result.message });
        }
    } catch (error) {
        console.error('Error updating session:', error);
        return res.status(500).json({ error: 'An error occurred while updating the session.' });
    }
});

app.get('/playerPage', async (req, res) => {
    try {
        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

        res.render('playerPage', {
            sports: allSports.map(sport => sport.name),
            sessions: allSessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/createSession', async (req, res) => {
    try {
        const allSports = await Sports.findAll();

        res.render('createSession', {
            sports: allSports.map(sport => sport.name)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/availableSessions', async (req, res) => {
    try {
        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

        res.render('availableSessions', {
            sports: allSports.map(sport => sport.name),
            sessions: allSessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});

