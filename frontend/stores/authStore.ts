import { makeAutoObservable, runInAction } from "mobx";
import {
  login as apiLogin,
  signup as apiSignup,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
} from "../api/auth";

export class AuthStore {
  user: any = null;
  token: string | null = null;
  loading = false;
  error: string | null = null;
  rootStore?: any;

  constructor(rootStore?: any) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("accessToken");
    }
  }

  async login(email: string, password: string) {
    this.loading = true;
    this.error = null;

    try {
      const data = await apiLogin(email, password);

      runInAction(() => {
        this.user = data.user;
        this.token = data.token;
        this.loading = false;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.token); // ✅ only once
      }
      this.token = data.accessToken;
localStorage.setItem("accessToken", data.accessToken);

    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Login failed";
        this.loading = false;
      });
    }
  }

  async signup(email: string, password: string) {
    this.loading = true;
    this.error = null;

    try {
      const data = await apiSignup(email, password);

      runInAction(() => {
        this.user = data.user;
        this.token = data.token;
        this.loading = false;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.token);
      }
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Signup failed";
        this.loading = false;
      });
    }
  }

  async requestOtp(email: string) {
    this.loading = true;
    this.error = null;

    try {
      await apiRequestOtp(email);

      runInAction(() => {
        this.loading = false;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Request OTP failed";
        this.loading = false;
      });
    }
  }

  async verifyOtp(email: string, otp: string) {
    this.loading = true;
    this.error = null;

    try {
      const data = await apiVerifyOtp(email, otp);

      runInAction(() => {
        this.user = data.user;
        this.token = data.token;
        this.loading = false;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.token);
      }
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Verify OTP failed";
        this.loading = false;
      });
    }
  }

  logout() {
    this.user = null;
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
  }
}

export const authStore = new AuthStore();
