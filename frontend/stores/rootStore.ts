// stores/RootStore.ts
import { AuthStore } from './authStore';
import { ChatStore } from './chatStore';
import { GroupStore } from './groupStore';
import { SessionStore } from './sessionStore';
import { UserStore } from './userStore';

export class RootStore {
  authStore: AuthStore;
  chatStore: ChatStore;
  groupStore: GroupStore;
  sessionStore: SessionStore;
  userStore: UserStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.chatStore = new ChatStore();
    this.groupStore = new GroupStore(this);
    this.sessionStore = new SessionStore(this);
    this.userStore = new UserStore(this);
  }
}
