import { Request, Response } from 'express';
import {
  createNewLink,
  createLinkId,
  getLinkById,
  updateLinkVisits,
  allLinks,
  getLinksByUserId,
  linkBelongsToUser,
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
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err as Error);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { linkId } = req.params as targetLinkId;

  let link = await getLinkById(linkId);
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

async function getLinkByUser(req: Request, res: Response): Promise<void> {
  const { isLoggedIn } = req.session;
  const { userId } = req.params as targetUserId;
  const { linkId } = req.params as targetLinkId;

  const user = await getUserById(userId);
  const owner = await linkBelongsToUser(linkId, userId);

  if (!user) {
    res.sendStatus(404);
  }

  if (!isLoggedIn || !owner) {
    const links = await getLinksByUserId(userId);
    res.json(links);
    return;
  }

  const links = await getLinksByUserIdForOwnAccount(userId);
  res.json(links);
}

async function deleteUserLinks(req: Request, res: Response): Promise<void> {
  const { isLoggedIn } = req.session;
  const { userId } = req.params as targetUserId;

  if (!isLoggedIn) {
    res.sendStatus(401);
    return;
  }

  const { linkId } = req.params as targetLinkId;

  const linkExist = await linkBelongsToUser(linkId, userId);

  if (!linkExist) {
    res.sendStatus(403);
    return;
  }
  await deleteLinks(linkId);
  res.sendStatus(204);
}

export { shortenUrl, getOriginalUrl, getAllLinks, getLinkByUser, deleteUserLinks };
