import { makeAutoObservable } from "mobx";

export class SessionStore {
  rootStore?: any;
  session: any = null;
  loading = false;
  error: string | null = null;

  constructor(rootStore?: any) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  // Add session management methods here
}

export const sessionStore = new SessionStore(null); 