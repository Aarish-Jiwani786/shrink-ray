type DatabaseConstraintError = {
  type: 'unique' | 'check' | 'not null' | 'foreign key' | 'unknown';
  columnName?: string;
  message?: string;
};

type NewUserRequest = {
  password: string;
  username: string;
};

type NewLinkRequest = {
  originalUrl: string;
};

type targetLinkId = {
  linkId: string;
};

type targetUserId = {
  userId: string;
};
