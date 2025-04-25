/// <reference types="@types/google.maps" />

declare module "@googlemaps/js-api-loader" {
  export class Loader {
    constructor(options: { apiKey: string; version: string });
    load(): Promise<typeof google>;
  }
}
