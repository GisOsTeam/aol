import OlMap from 'ol/Map';
import { Extent } from 'ol/extent';
import { MapEvent } from 'ol';

export class ViewManager {
  private olMap: OlMap;

  private initialExtent: Extent;
  private currentExtent: Extent;
  private futureExtends: Extent[] = [];
  private pastExtends: Extent[] = [];
  private shouldUpdate = true;

  constructor(olMap: OlMap) {
    this.olMap = olMap;

    // L'init de l'application fait un premier fit,
    // donc la valeur par défaut de currentView se fera à ce moment là
    this.olMap.on('moveend', this.updateExtends.bind(this));
  }

  /**
   * Unregister events listeners
   * Have to be called when application is destroyed
   */
  public unregister() {
    this.olMap.un('moveend', this.updateExtends.bind(this));
  }

  /**
   * Go to Previous view
   */
  public fitToPrevious = () => {
    const { pastExtends } = this;
    if (pastExtends.length > 0) {
      this.shouldUpdate = false;
      this.olMap.getView().fit(pastExtends[pastExtends.length - 1], {
        callback: this.onPastFitEnd.bind(this),
      });
    }
  };

  /**
   * Go to Next view
   */
  public fitToNext = () => {
    const { futureExtends } = this;

    if (futureExtends.length > 0) {
      this.shouldUpdate = false;
      this.olMap.getView().fit(futureExtends[0], {
        callback: this.onFutureFitEnd.bind(this),
      });
    }
  };

  /**
   * Go to Initial view
   */
  public fitToInitial = () => {
    if (this.initialExtent) {
      this.olMap.getView().fit(this.initialExtent);
    }
  };

  private updateExtends(evt: MapEvent) {
    if (this.shouldUpdate) {
      const { frameState } = evt;
      // Premier moveend
      if (!this.initialExtent) {
        this.initialExtent = frameState.extent;
      } else {
        this.pastExtends = [...this.pastExtends, this.currentExtent];
      }
      this.currentExtent = frameState.extent;
      this.futureExtends = [];

      console.log('New Extent', {
        pastExtends: this.pastExtends,
        currentExtent: this.currentExtent,
        futureExtends: this.futureExtends,
      });
    }
    this.shouldUpdate = true;
  }

  private onPastFitEnd() {
    const newPastExtends = [...this.pastExtends];
    const newExtent = newPastExtends.pop();
    const newFutureExtends = [this.currentExtent, ...this.futureExtends];

    this.currentExtent = newExtent;
    this.pastExtends = newPastExtends;
    this.futureExtends = newFutureExtends;
  }

  private onFutureFitEnd() {
    const newPastExtends = [...this.pastExtends, this.currentExtent];
    const newFutureExtends = [...this.futureExtends];
    const newExtent = newFutureExtends.shift();

    this.currentExtent = newExtent;
    this.pastExtends = newPastExtends;
    this.futureExtends = newFutureExtends;
  }
}
