import { Entity, PrimaryColumn, Column, Relation, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity()
export class Link {
  @PrimaryColumn()
  linkID: string;

  @Column()
  originalUrl: string;

  @Column()
  lastAccessedOn: Date;

  @Column({ default: 0 })
  numHits: number;

  @ManyToOne(() => User, (user) => user.links)
  user: Relation<User>;
}
