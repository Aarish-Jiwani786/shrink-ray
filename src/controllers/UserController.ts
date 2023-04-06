import { Request, Response } from 'express';
import argon2 from 'argon2';
import { getUserByUsername, addNewUser } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function registerUser(req: Request, res: Response): Promise<void> {
  // TODO: Implement the registration code
  // Make sure to check if the user with the given username exists before attempting to add the account
  // Make sure to hash the password before adding it to the database
  // Wrap the call to `addNewUser` in a try/catch like in the sample code
  const { username, password } = req.body as NewUserRequest;

  // if (username) {
  //   res.sendStatus(400);
  //   return;
  // }

  // Hash Password
  const passwordHash = await argon2.hash(password);

  try {
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser);
    res.redirect('/login');
    return;
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err as Error);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as NewUserRequest;

  const user = await getUserByUsername(username);

  if (!user) {
    res.sendStatus(404);
    return; // exit the function
  }

  const { passwordHash } = user;

  // Check password
  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(404);
    return;
  }

  req.session.isLoggedIn = true;
  req.session.authenticatedUser = {
    userId: user.userId,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
    username,
  };

  res.redirect('/shrink');
}

export { registerUser, logIn };
