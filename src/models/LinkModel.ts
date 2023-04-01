import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);
const userRepository = AppDataSource.getRepository(User);

// const md5 = createHash('md5');
// md5.update('https://youtube.com/watch?v=dQw4w9WgXcQ');
// const urlHash = md5.digest('base64url');

// console.log(`MD5 Hash: ${urlHash}`);

async function getLinkById(linkID: string): Promise<Link | null> {
  const link = await linkRepository.findOne({
    where: { linkID },
  });

  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl + userId); /* TODO: concatenate the original url and userId */
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(0, 9); /* TODO: Get only the first 9 characters of `urlHash` */

  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  // TODO: Implement me!
  let newLink = new Link();
  newLink.linkID = linkId;
  newLink.originalUrl = originalUrl;
  newLink.user = creator;
  newLink.lastAccessedOn = new Date();
  newLink = await linkRepository.save(newLink);

  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  // Increment the link's number of hits property
  const updatedHits = link;
  updatedHits.numHits += 1;
  const now = new Date();
  await linkRepository
    .createQueryBuilder()
    .update(link)
    .set({ numHits: updatedHits.numHits, lastAccessedOn: now })
    .where({ linkID: updatedHits.linkID })
    .execute();

  return updatedHits;
  // Create a new date object and assign it to the link's `lastAccessedOn` property.
  // Update the link's numHits and lastAccessedOn in the database
  // return the updated link
}

async function allLinks(): Promise<User[]> {
  const allLink = await userRepository.find({ relations: ['links'] });
  return allLink;
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .leftJoinAndSelect('link.user', 'user') /* TODO: specify the relation you want to join with */
    .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
    .select([
      'link.linkId',
      'link.originalUrl',
      'user.userId',
      'user.username',
      'user.isAdmin',
      /* TODO: specify the fields you want */
    ])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  // TODO: This function is pretty much the same but it should return the fields
  const links = await linkRepository
    .createQueryBuilder('link')
    .leftJoinAndSelect('link.user', 'user') /* TODO: specify the relation you want to join with */
    .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
    .select([
      'link.linkId',
      'link.originalUrl',
      'link.numHits',
      'user.userId',
      'user.username',
      'user.isPro',
      'user.isAdmin',
      /* TODO: specify the fields you want */
    ])
    .getMany();

  return links;
}

async function linkBelongsToUser(linkId: string, userId: string): Promise<boolean> {
  const linkExists = await linkRepository
    .createQueryBuilder('link')
    .leftJoinAndSelect('link.user', 'user')
    .where('link.linkId = :linkId', { linkId })
    .andWhere('user.userId = :userId', { userId })
    .getExists();

  return linkExists;
}

async function deleteLinks(linkId: string): Promise<void> {
  await linkRepository
    .createQueryBuilder('link')
    .where('linkId = :linkId', { linkId })
    .delete()
    .execute();
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  allLinks,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  linkBelongsToUser,
  deleteLinks,
};
