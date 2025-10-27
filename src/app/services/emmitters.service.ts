import { Injectable } from '@angular/core';
import {Observable, ReplaySubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EmmittersService {

  uploadProfilePic$: ReplaySubject<any> = new ReplaySubject<any>();
  constructor() { }

  public setProfilePicture(picture: string) {
    this.uploadProfilePic$.next(picture);
  }

  public getProfilePicture(): Observable<any> {
    return this.uploadProfilePic$.asObservable();
  }
}
