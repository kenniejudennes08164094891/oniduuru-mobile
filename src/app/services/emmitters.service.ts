import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EmmittersService {

  uploadProfilePic$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  replaceReel$: ReplaySubject<any> = new ReplaySubject<any>();
  constructor() { }

  public setProfilePicture(picture: string) {
    this.uploadProfilePic$.next(picture);
  }

  public getProfilePicture(): Observable<any> {
    return this.uploadProfilePic$.asObservable();
  }

  public setReplacedReel(isReplaceReel:boolean){
    this.replaceReel$.next(isReplaceReel);
  }

  public getReplaceReel():Observable<any>{
    return this.replaceReel$.asObservable();
  }
}
