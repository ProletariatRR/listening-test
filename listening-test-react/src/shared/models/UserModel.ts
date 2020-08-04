export class UserModel {
  name: string;
  email: string;
  password?: string;
  policy?: boolean;
  isAdmin?: boolean;
  permissions?: string[];
}
