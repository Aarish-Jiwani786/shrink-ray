import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserByUsername(username: string): Promise<User | null> {
  const user = await userRepository.findOne({ where: { username } });
  return user;
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  // TODO: Add the new user to the database
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;
  // 2) Save it in the database
  newUser = await userRepository.save(newUser);
  // 3) Return the created user
  return newUser;
}

async function getUserById(userId: string): Promise<User | null> {
  const user = await userRepository.findOne({
    where: { userId },
    relations: ['links'],
  });

  return user;
}

export { getUserByUsername, addNewUser, getUserById };
