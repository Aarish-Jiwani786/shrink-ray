import './config'; // Load environment variables
import 'express-async-errors'; // Enable default error handling for async errors
import express, { Express } from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { registerUser, logIn } from './controllers/UserController';
import {
  shortenUrl,
  getOriginalUrl,
  removeLink,
  getLinks,
  getAllLinks,
} from './controllers/LinkController';

const app: Express = express();
app.use(express.json());
app.use(express.static('public', { extensions: ['html'] }));
app.use(express.urlencoded({ extended: false }));

const { PORT, COOKIE_SECRET } = process.env;

const SQLiteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.sqlite' }),
    secret: COOKIE_SECRET,
    cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
    name: 'session',
    resave: false,
    saveUninitialized: false,
  })
);

app.post('/api/users', registerUser);
app.post('/api/login', logIn);
app.post('/api/links', shortenUrl);
app.get('/:targetLinkId', getOriginalUrl);
app.get('/api/users/:targetUserId/links', getLinks);
app.get('/api/users/allLinks', getAllLinks);
app.delete('/api/users/:targetUserId/links/:targetLinkId', removeLink);

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
