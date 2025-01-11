const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const connectEnsureLogin = require('connect-ensure-login');
const bcrypt = require('bcrypt');
const { Sports, Sessions, Users } = require('./models');

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const saltRounds = 10;
// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 }  // Set session expiration
}));


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Authentication check middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();  // If the user is authenticated, proceed to the next middleware/route
    }
    res.redirect('/login');  // If not authenticated, redirect to login page
}

// Passport local strategy for authentication
passport.use(new LocalStrategy(
    async (email, password, done) => {
        try {
            const user = await Users.findOne({ where: { email: email } });

            if (!user) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            // Use bcrypt to compare the provided password with the hashed password
            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                return done(null, false, { message: 'Invalid credentials' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));


// Serialize user to store user ID in session
passport.serializeUser((user, done) => {
    done(null, user.id);  // Use the user ID as the session identifier
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await Users.findByPk(id);
        if (user) {
            done(null, user);  // User is properly deserialized
        } else {
            done(new Error('User not found'), null);
        }
    } catch (error) {
        done(error, null);
    }
});


app.get('/Dashboard', (req, res) => {
    res.render('Dashboard');
});

app.get('/adminPage', isAuthenticated, async (req, res) => {
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

app.post('/adminPage', isAuthenticated, async (req, res) => {
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

app.delete('/adminPage/:sportName', isAuthenticated, async (req, res) => {
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

app.get('/updateSessionForm', isAuthenticated, async (req, res) => {
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

app.post('/create-session', isAuthenticated, async (req, res) => {
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

app.delete('/delete-session/:sessionId',connectEnsureLogin.ensureLoggedIn(), isAuthenticated, async (req, res) => {
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

app.post('/update-session', isAuthenticated, async (req, res) => {
    const { sessionId, sport, teamA, teamASize, teamB, teamBSize, actualSize, place, date, time } = req.body;

    const parsedTeamASize = parseInt(teamASize);
    const parsedTeamBSize = parseInt(teamBSize);
    const parsedActualSize = parseInt(actualSize);

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

app.get('/createSession', isAuthenticated, async (req, res) => {
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

app.get('/availableSessions', isAuthenticated, async (req, res) => {
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

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login-details', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await Users.getUser(email);

        if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
                req.login(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    const { role } = user;
                    if (role === 'admin') {
                        res.redirect('/adminPage');
                    } else if (role === 'player') {
                        res.redirect('/playerPage');
                    }
                });
            } else {
                res.redirect('/invalidLogin');
            }
        } else {
            res.redirect('/invalidLogin');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
        res.redirect('/invalidLogin');
    }
});


Users.getUser = function (email) {
    return this.findOne({
        where: {
            email: email
        }
    });
};

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/email_exists',(req,res)=>{
    res.render('email_exists');
})

app.get('/invalidLogin',(req,res)=>{
    res.render('invalidLogin');
})

app.post('/signup-details', async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const hashedPwd = await bcrypt.hash(req.body.password,saltRounds)
        console.log(hashedPwd);
        const user = await Users.addUser(firstName, lastName, email, hashedPwd, role);

        res.redirect('/login');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while creating the user.' });
        res.redirect('/email_exists');
    }
});


app.post('/updateIncreaseTeamSize', async (req, res) => {
    try {
        const { sessionId } = req.body;
        console.log('Received sessionId:', sessionId);

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required.' });
        }

        const session = await Sessions.findByPk(sessionId);
        console.log('Current Session:', session);

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        // Log the current team sizes
        console.log('Team A Size:', session.teamAsize, 'Team B Size:', session.teamBsize, 'Max Team Size:', session.actualTeamSize);

        if (session.teamAsize < session.teamBsize) {
            console.log("Increasing Team A Size");
            session.teamAsize += 1;
        } else if (session.teamBsize < session.teamAsize) {
            console.log("Increasing Team B Size");
            session.teamBsize += 1;
        } else {
            return res.status(200).json({ message: 'Both teams have reached the maximum size.' });
        }

        await session.save();
        console.log('Updated Session:', session);
        res.status(200).json({ message: 'Team size updated successfully!', session });

    } catch (error) {
        console.error('Error updating team sizes:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'An error occurred while updating the team sizes.' });
        }
    }
});

app.post('/updateDecreaseTeamSize', async (req, res) => {
    try {
        const { sessionId } = req.body;
        console.log('Received sessionId:', sessionId);

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required.' });
        }

        const session = await Sessions.findByPk(sessionId);
        console.log('Current Session:', session);

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        // Log the current team sizes
        console.log('Team A Size:', session.teamAsize, 'Team B Size:', session.teamBsize, 'Max Team Size:', session.actualTeamSize);

        if (session.teamAsize < session.teamBsize) {
            console.log("Increasing Team A Size");
            session.teamAsize += 1;
        } else if (session.teamBsize < session.teamAsize) {
            console.log("Increasing Team B Size");
            session.teamBsize += 1;
        } else {
            return res.status(200).json({ message: 'Both teams have reached the maximum size.' });
        }

        await session.save();
        console.log('Updated Session:', session);
        res.status(200).json({ message: 'Team size updated successfully!', session });

    } catch (error) {
        console.error('Error updating team sizes:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'An error occurred while updating the team sizes.' });
        }
    }
});





app.get('/reports', async (req, res) => {
    try {
        const allSports = await Sports.findAll();
        const allSessions = await Sessions.findAll();

        const sports = allSports.map(sport => sport.name);

        const sessionsPerSport = sports.map(sport => {
            const sessionCount = allSessions.filter(session => session.sport === sport).length;
            return { sport, sessionCount };
        });

        res.render('reports', {
            sports,
            sessions: allSessions,
            sessionsPerSport
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(4000, () => {
    console.log('Server is running on http://localhost:4000');
});
