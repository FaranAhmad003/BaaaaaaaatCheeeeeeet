import { makeAutoObservable } from "mobx";

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

  // Add user management methods here
}

export const userStore = new UserStore(null); 