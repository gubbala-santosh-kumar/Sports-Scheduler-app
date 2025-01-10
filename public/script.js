function validateSport() {
    const sportInput = document.getElementById('sport').value.trim().toLowerCase();
    const sportsList = Array.from(document.querySelectorAll('.sports-list li h1')).map(h1 => h1.textContent.toLowerCase());

    if (sportsList.includes(sportInput)) {
        alert('Sport already exists.');
        return false;
    }
    return true;
}

async function deleteSport(sportName) {
    try {
        const response = await fetch(`/adminPage/${sportName}`, { method: 'DELETE' });
        const sports = await response.json();

        const sportItem = document.querySelector(`li[data-sport="${sportName}"]`);
        if (sportItem) {
            sportItem.remove();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function openSessionForm() {
    document.getElementById("sessionFormContainer").style.display = "block";
}

function updateSession(sessionId, sessions) {
    sessions = JSON.parse(sessions);
    console.log("Update the form where the id is :", sessionId);
    document.getElementById("updateSessionFormContainer").style.display = "block";

    const session = sessions.find(s => s.id === sessionId);
    console.log('Found session:', session);

    if (!session) {
        console.error('Session not found!');
        return;
    }

    document.getElementById('sessionId').value = session.id;
    document.getElementById('sport').value = session.sport;
    document.getElementById('teamA').value = session.teamA;
    document.getElementById('teamASize').value = parseInt(session.teamAsize);
    document.getElementById('teamB').value = session.teamB;
    document.getElementById('teamBSize').value = parseInt(session.teamBsize);
    document.getElementById('actualSize').value = parseInt(session.actualTeamSize);
    document.getElementById('place').value = session.place;
    document.getElementById('date').value = session.date.split('T')[0];
    document.getElementById('time').value = session.time;
}

async function submitSessionForm(event) {
    event.preventDefault();
    const form = document.getElementById('sessionForm');
    const formData = new FormData(form);

    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    console.log(formObject);

    try {
        const response = await fetch('/create-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formObject)
        });

        const result = await response.json();
        console.log('Server Response:', result);

        if (response.ok) {
            alert('Session created successfully!');
            window.location.reload();
        } else {
            alert('Error creating session!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error while creating the session.');
    }
}

function deleteSession(sessionId) {
    if (confirm("Are you sure you want to delete this session?")) {
        fetch(`/delete-session/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert("Session deleted successfully.");
                location.reload();
            } else {
                alert("Failed to delete the session.");
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while deleting the session.");
        });
    }
}

function getFormData(event) {
    const form = document.getElementById('updateSessionForm');
    const sessionData = {
        sessionId: form.sessionId.value,
        sport: form.sport.value,
        teamA: form.teamA.value,
        teamASize: parseInt(form.teamASize.value),
        teamB: form.teamB.value,
        teamBSize: parseInt(form.teamBSize.value),
        actualSize: parseInt(form.actualSize.value),
        place: form.place.value,
        date: form.date.value,
        time: form.time.value
    };

    console.log(sessionData);

    fetch('/update-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        return response.text().then(text => { throw new Error(text) });
    })
    .then(data => {
        console.log('Session updated:', data);
        alert('Session updated successfully!');
        window.location.reload();
        document.getElementById('updateSessionFormContainer').style.display = 'none';
    })
    .catch(error => {
        console.error('Error updating session:', error);
        alert('Error updating session: ' + error.message);
    });
}
