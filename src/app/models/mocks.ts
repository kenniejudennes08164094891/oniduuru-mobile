import { Type } from "@angular/core";

export interface DeviceView {
    title?: string;
    route: string;
    iosComponent: Type<any>;
    androidComponent: Type<any>;
    selector?: string;
}

export interface TabItems{
    path: string;
    ionIcon: string;
    routerLink?:string;
}
export interface LoginCredentials{
  email: string,
  password: string
}
