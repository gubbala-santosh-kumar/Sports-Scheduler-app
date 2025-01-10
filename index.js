const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { Sports , Sessions} = require('./models');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    // try {
    //     const allSports = await Sports.select();
    //     res.render('adminPage', { sports: allSports.map(sport => sport.name) });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).send('Internal Server Error');
    // }
    res.send("Dashboard Page");
});

app.get('/adminPage', async (req, res) => {
    try {

        const allSports = await Sports.findAll();
        const allSession = await Sessions.findAll();
        console.log(allSession);
        res.render('adminPage', { 
            sports: allSports.map(sport => sport.name),
            sessions: allSession
        });
        res.render('adminPage', { sports: allSports.map(sport => sport.name) });
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

        const allSports = await Sports.select();
        res.render('adminPage', { sports: allSports.map(sport => sport.name) });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/adminPage/:name', async (req, res) => {
    try {
        const sportName = req.params.name;
        await Sports.removeSport(sportName);

        const allSports = await Sports.select();
        res.json(allSports.map(sport => sport.name));
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/create-session', async(req, res) => {
    try {
        const body = req.body;   
        const teamAsize= parseInt( body.teamASize);
        const teamBsize= parseInt(body.teamBSize);
        const actualSize= parseInt(body.actualSize);
        
        console.log("Team A Size",teamAsize);
        console.log("Team B Size",teamBsize);
        console.log("Actual Team Size",actualSize);

        const newSession = await Sessions.create({
            sport: body.sport,
            teamA: body.teamA,
            teamB: body.teamB,
            teamAsize: teamAsize,  
            teamBsize: teamBsize,  
            actualTeamSize: actualSize, 
            place: body.place,
            date: body.date,
            time: body.time
        });

        console.log('Session Details:', body);

        res.status(200).json({
             message: 'Session created successfully!',
             session: newSession
        });
    } 
    catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session.'});
    }
});

app.delete('/delete-session/:id', (req, res) => {
    const sessionId = req.params.id;

    // Assuming you have a function to delete a session from the database
    Sessions.deleteSessionFromDatabase(sessionId)
        .then(() => {
            res.status(200).send({ message: 'Session deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting session:', error);
            res.status(500).send({ error: 'Failed to delete session' });
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});