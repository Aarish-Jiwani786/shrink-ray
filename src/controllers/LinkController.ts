import { Request, Response } from 'express';
import {
  createNewLink,
  createLinkId,
  getLinkById,
  updateLinkVisits,
  allLinks,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinks,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  const { authenticatedUser, isLoggedIn } = req.session;
  // Make sure the user is logged in
  if (!isLoggedIn) {
    // send the appropriate response
    res.sendStatus(404);
    return;
  }
  // Get the userId from `req.session`
  const { userId } = authenticatedUser;
  // Retrieve the user's account data using their ID
  const user = await getUserById(userId);
  // Check if you got back `null`
  if (!user) {
    // send the appropriate response
    res.sendStatus(404);
    return;
  }
  // Check if the user is neither a "pro" nor an "admin" account
  if (!user.isAdmin || !user.isPro) {
    // check how many links they've already generated
    const num = user.links.length;
    // if they have generated 5 links
    if (num === 5) {
      // send the appropriate response
      res.sendStatus(403);
    }
  }
  // Generate a `linkId`
  const { originalUrl } = req.body as NewLinkRequest;
  const linkId = createLinkId(originalUrl, userId);
  // Add the new link to the database (wrap this in try/catch)
  try {
    const link = await createNewLink(originalUrl, linkId, user);
    // Respond with status 201 if the insert was successful
    res.json(link);
    return;
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err as Error);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { targetLinkId } = req.params as targetLinkId;

  let link = await getLinkById(targetLinkId);

  // Check if you got back `null`
  if (!link) {
    // send the appropriate response
    res.sendStatus(404);
    return;
  }

  // Call the appropriate function to increment the number of hits and the last accessed date
  link = await updateLinkVisits(link);

  const targetURL = link.originalUrl;

  // Redirect the client to the original URL
  res.redirect(301, targetURL);
}

async function getAllLinks(req: Request, res: Response): Promise<void> {
  const links = await allLinks();

  res.json(links);
}

async function getLinks(req: Request, res: Response): Promise<void> {
  const { targetUserId } = req.params as UserIdParam;

  let links;
  if (!req.session.isLoggedIn || req.session.authenticatedUser.userId !== targetUserId) {
    links = await getLinksByUserId(targetUserId);
  } else {
    links = await getLinksByUserIdForOwnAccount(targetUserId);
  }

  res.json(links);
}

async function removeLink(req: Request, res: Response): Promise<void> {
  const { targetUserId, targetLinkId } = req.params as DeleteLinkRequest;
  const { isLoggedIn, authenticatedUser } = req.session;
  if (!isLoggedIn) {
    res.sendStatus(401);
    return;
  }

  const link = await getLinkById(targetLinkId);
  if (!link) {
    res.sendStatus(404);
    return;
  }

  if (authenticatedUser.userId !== targetUserId && !authenticatedUser.isAdmin) {
    res.sendStatus(403);
    return;
  }

  await deleteLinks(targetLinkId);

  res.sendStatus(200);
}

export { shortenUrl, getOriginalUrl, getAllLinks, getLinks, removeLink };
