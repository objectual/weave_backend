"use strict";

import { IEvent } from "./event.model";

export interface ILocation{
    id?:string;
    address: string;
    lat: number;
    long: number;
    event?: IEvent[]
}
