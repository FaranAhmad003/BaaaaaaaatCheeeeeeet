import { makeAutoObservable } from "mobx";
import { fetchOtherUserEmails } from '../api/users';

export class UserStore {
  rootStore?: any;
  users: any[] = [];
  profile: any = null;
  loading = false;
  error: string | null = null;

  constructor(rootStore?: any) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  async fetchOtherUserEmails() {
    this.loading = true;
    this.error = null;
    try {
      const users = await fetchOtherUserEmails();
      this.users = users;
    } catch (err: any) {
      this.error = err.message || 'Failed to fetch user emails';
    } finally {
      this.loading = false;
    }
  }

  // Add user management methods here
}

export const userStore = new UserStore(null); 