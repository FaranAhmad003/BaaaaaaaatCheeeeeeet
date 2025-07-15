import { makeAutoObservable } from "mobx";

export class GroupStore {
  rootStore?: any;
  groups: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(rootStore?: any) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  // Add group management methods here
}

export const groupStore = new GroupStore(null); 