const routes = require('express').Router();
const passport = require('passport')
const Middleware = require('../middleware')
const {
    UserManagement
} = require('../../Managers/UserManager.js');
const {
    ErrorManagement
} = require('../../Managers/ErrorManager.js');
const {
    SchoolManagement
} = require('../../Managers/SchoolManager.js');
const fs = require('fs');
const {
    promisify
} = require('util')
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)
const bcrypt = require('bcrypt');
const {
    v4: uuidv4
} = require("uuid");
const utils = require('../../utils.js')
const ClassManager = require('../../Managers/ClassManager.js')

let pending_meetings = require('../container/meetings').pending_meetings;
let started_meetings = require('../container/meetings').started_meetings;

// root route for login
routes.get("/login", Middleware.CheckNotAuth, (req, res) => {
    res.render("login", {
        isLogin: false,
        err: 100
    })
});

routes.get('/', (req, res) => {
    res.render('index')
})

// dashboard 
routes.get('/dashboard', Middleware.CheckAuth, (req, res) => {
    res.render('dashboard', {
        user: req.user,
        loggedIn: true,
        err: 100,
        meetings: pending_meetings
    })
})

routes.get('/aft/login/router', Middleware.CheckAuth, (req, res) => {
    if (UserManagement.isAdmin(req.user)) return res.redirect(`/school/${req.user.schoolID}/admin`);
    else return res.redirect('/dashboard');
})

routes.post('/user/login', Middleware.CheckNotAuth, passport.authenticate('local', {
    successRedirect: '/aft/login/router',
    failureRedirect: '/login',
    failureFlash: true
}));

//get request to handle new class creation for teacher
routes.get('/teacher/create-meeting', Middleware.CheckAuth, (req, res) => {
    if (req.user.type == "student") return res.redirect('/');
    res.render('create-meeting.ejs')
});

// get request to handle displaying register
routes.get('/admin/register', Middleware.CheckAuth, (req, res) => {
    if (req.user.type != "admin") return res.redirect('/');
    res.render('register');
});

routes.get('/share/meeting/:id', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('joinmeeting.ejs', {
            user: req.user,
            loggedIn: true,
            id: req.params.id
        });
    } else {
        res.render('joinmeeting.ejs', {
            user: false,
            loggedIn: false,
            id: false
        });
    }
})

// post signal for login
routes.post('/admin/register/server', Middleware.CheckAuth, async (req, res) => {
    try {
        if (req.user.type != "admin") return res.redirect('/');
        const email = req.body.email;
        const password = req.body.password;
        const _hashedPassword = await bcrypt.hash(password, 10);
        const id = Date.now().toString();
        users.push({
            id: id,
            email: email,
            password: _hashedPassword,
            f_name: req.body.f_name,
            l_name: req.body.l_name,
            type: "student",
        })
        res.redirect('/');
        const TryUpload = async () => {
            const data = await readFile('./db/users_secure.json', 'utf-8');
            obj = JSON.parse(data);
            var _users = obj.users;
            _users.push({
                id: id,
                email: email,
                password: _hashedPassword,
                f_name: req.body.f_name,
                l_name: req.body.l_name,
                type: "student",
            });
            json = JSON.stringify(obj, 2, null);
            await writeFile('./db/users_secure.json', json, 'utf-8');
        }
        TryUpload();
    } catch {
        res.redirect('/admin/register?state=false&err=001');
    }
});

routes.get('/post-meeting', (req, res) => {
    res.render('post-meeting.ejs')
})

// create a meeting
routes.post('/create/meeting/', Middleware.CheckAuth, (req, res) => {
    const meeting_key = uuidv4();
    const pwd = Math.floor(Math.random() * 90000) + 10000;
    const meeting = {
        id: Date.now().toString(),
        key: meeting_key,
        hostID: req.user.id,
        pwd: pwd,
        topic: req.body.topic,
        type: req.body.type,
        desc: req.body.desc,
        start: false,
        max: 20,
        users: []
    }
    pending_meetings.push(meeting);
    res.send(meeting);
});

routes.get('/err', (req, res) => res.render('err'));

routes.post('/meeting/start/:id', Middleware.CheckAuth, (req, res) => {
    if (isOccupied(req.user.id)) return res.send('err');
    let meeting = pending_meetings.find(o => o.id == req.params.id);
    let data = {
        meeting_id: meeting.id,
        meeting_password: meeting.pwd
    }
    res.send(data);
    started_meetings.push(meeting);
    const i = pending_meetings.indexOf(meeting);
    if (i > -1) {
        pending_meetings.splice(i, 1);
    }
})

routes.post('/join/meeting', Middleware.CheckAuth, (req, res) => {
    if (isOccupied(req.user.id)) return res.send('err');
    let meeting = started_meetings.find(o => o.id == req.body.id);
    if (meeting == undefined || meeting.pwd != req.body.pwd) return res.send('err');;
    meeting.users.push(req.user.id);
    res.send(`/meeting/${meeting.key}`);
})

// getting the uuid room route
routes.get("/meeting/:room", Middleware.CheckAuth, (req, res) => {
    let meeting = started_meetings.find(o => o.key == req.params.room);
    if (meeting == undefined) res.redirect('/')
    else {
        if (meeting.users.includes(req.user.id)) {
            res.render("room", {
                roomId: req.params.room,
                id_user: req.user.id,
                f_name: req.user.f_name,
                l_name: req.user.l_name,
                email: req.user.email
            });
        } else return res.redirect('/err');
    }
});

/*
  Class Rooms & School
 
  This is the start of all routes 
  which are required to get or
  posted to for all class room
  related actions for schools
 
*/

routes.get('/school/:schoolID/admin', Middleware.CheckAuth, async (req, res) => {
    if (!UserManagement.isAdmin(req.user)) {
        ErrorManagement.ThrowError.Permissions.Insufficient();
        return res.send(500);
    } else {
        const school = await SchoolManagement.GetSchool(1630507665048);
        res.render('admin', {
            school: school
        })
    }
})


routes.get('/school/:schoolID/classroom', (req, res) => {

})


/*
 
  End of Class room routes
 
*/

routes.get('/dev', Middleware.CheckAuth, (req, res) => {
    if (req.user.type === "admin")
        res.render('dev.ejs')
    else res.sendStatus(100)
})

module.exports = routes;

function isOccupied(userPointer) {
    for (var i = 0; i < pending_meetings.length; i++) {
        if (pending_meetings[i].users.includes(userPointer)) {
            return true;
        }
    }
    for (var i = 0; i < started_meetings.length; i++) {
        if (started_meetings[i].users.includes(userPointer)) {
            return true;
        }
    }
    return false;
}

