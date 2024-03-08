const express = require("express");
const app = express();
const PORT = process.env.PORT || 3333;

// Firestore Initialization
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
var admin = require("firebase-admin");
var serviceAccount = require("./key/service_account.json");
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});
const db = getFirestore(); 

// Middleware
app.use(express.json());

/* USER ENDPOINTS */

// NOTE Will be handled in frontend using Firebase Authentication (can use if we want server side logic like setting up default data)
// POST /register: Register a new user
	// TODO add a user in Firestore that is associated with Firebase Authentication UUID
// POST /login: Log in a user

// TODO GET /user/:id: Get a user's information
// TODO PUT /user/:id: Update a user's information
// TODO GET /user/:id/saved-events: Get all events saved
// TODO Get clubs the user is part of
// TODO POST POST /users/:userId/events/:eventId: Save an event to a user's account


/* ORGANIZATION ENDPOINTS */

// POST /organizations: Add a new club
app.post('/organizations', async (req,res) => {
	const { name, description, admin } = req.body
	const org = {
		name,
		description,
		admin // TODO Change admin to take in a user ID 
	}
	const orgRef = await db.collection('organizations'). add(org)
	res.status(201).send(`Club with ID ${orgRef.id} created`)
})

// GET /clubs: Get all clubs
app.get('/organizations',async (req, res) => {
	const snapshot = await db.collection('organizations').get();
	const orgs = []

	snapshot.forEach(doc => {
		let id = doc.id;
		let data = doc.data()
		orgs.push({id,...data});		
	});
	res.send(orgs)
})

// GET /organization/:orgName: Get a specific club
app.get('/organizations/:orgName', async (req, res) => {
	const { orgName } = req.params;
	// Using names bc org IDs are gibberish that no one will remember
	const snapshot = await db.collection('organizations').where('name', '==', orgName).get();

	if (snapshot.empty) {
		res.status(404).send('No organization with this name');
		return;
	}

	const doc = snapshot.docs[0];
	const org = { id: doc.id, ...doc.data() };
	res.send(org);
});

// PUT /organizations/:orgName: Update a club's information
app.put('/organizations/:orgName', async (req, res) => {
	const { orgName } = req.params;
	const { name, description, admin } = req.body;

	// Using names bc org IDs are gibberish that no one will remember
	const snapshot = await db.collection('organizations').where('name', '==', orgName).get();

	if (snapshot.empty) {
		res.status(404).send('No organization with this name');
		return;
	}

	const doc = snapshot.docs[0];
	const orgRef = db.collection('organizations').doc(doc.id);

	await orgRef.update({
		name,
		description,
		admin
	});

	res.send('Club information updated');
});

// DELETE /organizations/:orgName: Delete a club
app.delete('/organizations/:orgName', async (req, res) => {
	const { orgName } = req.params;

	// Using names bc org IDs are gibberish that no one will remember
	const snapshot = await db.collection('organizations').where('name', '==', orgName).get();

	if (snapshot.empty) {
		res.status(404).send('No organization with this name');
		return;
	}

	const doc = snapshot.docs[0];
	const orgRef = db.collection('organizations').doc(doc.id);

	await orgRef.delete();

	res.send('Club deleted');
});
// TODO PUT /organizations/:orgName/members/:userId: Join a club (add a user to a club's member list)

app.post('/clubs/:id/join/:userId', async (req, res) => {
})

/* EVENT ENDPOINTS */
// Get all events
app.get('/get-all-events',async (req, res) => {
	const snapshot = await db.collection('events').get();
	const events = []

	snapshot.forEach(doc => {
		let id = doc.id;
		let data = doc.data()
		events.push({id,...data});		
	});
	res.send(events)
})

// POST /organizations/:orgName/newEvent: Add a new event to a club
app.post('/organizations/:orgName/newEvent', async (req, res) =>{
	const { orgName } = req.params
	const { eventName, eventDescription, eventDate } = req.body;
	const snapshot = await db.collection('organizations').where('name','==', orgName).get()

	if( snapshot.empty){
		res.status(404).send('No organization with that name')
		return;
	}

	const orgId = snapshot.docs[0].id;
	const event = {
		orgId,
		eventName,
		eventDescription,
		eventDate
	}
	const eventRef = db.collection('events').add(event)
	res.send('Event created:' + eventName)

	// FIXME Only allow certain users (org officers) to add an event to a club
})

// GET /organizations/:id/events: Get all events of a club
app.get('/organizations/:orgName/events', async (req, res) => {
	const { orgName } = req.params;
	const orgSnapshot = await db.collection('organizations').where('name', '==', orgName).get();
	
	if (orgSnapshot.empty) {
		res.status(404).send('No organization with this name');
		return;
	}
	const orgId = orgSnapshot.docs[0].id;
	const eventSnapshot = await db.collection('events').where('orgId', '==', orgId).get();
	const events = [];

	eventSnapshot.forEach(doc => {
		let id = doc.id;
		let data = doc.data();
		events.push({ id, ...data });
	});
	
	res.send(events);
});

// TODO GET /organizations/:id/events/:eventId: Get a specific event of a club
// TODO PUT /organizations/:id/events/:eventId: Update an event of a club
// TODO DELETE /organizations/:id/events/:eventId: Delete an event of a club


// Listen to Server
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});