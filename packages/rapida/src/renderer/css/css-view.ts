import { uuid } from '@rapidajs/rapida-common';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { Camera } from '../../camera';
import { Scene } from '../../scene';
import { CSSRenderer } from './css-renderer';
import { View, ViewRectangle, ViewRectangleParams, ViewSize } from '../view';

/**
 * Params for creating a css view
 */
type CSSViewParams = {
  /**
   * The camera for the view
   */
  camera: Camera;

  /**
   * The scene for the view
   */
  scene: Scene;

  /**
   * The viewport for the view. Defaults to the full screen.
   */
  viewport?: ViewRectangleParams;

  /**
   * The scissor for the view. Defaults to the full screen.
   */
  scissor?: ViewRectangleParams;

  /**
   * The z index for the view. Determines what order the views are rendered in, therefore what layer the view is on. Defaults to zero.
   */
  zIndex?: number;
};

/**
 * A CSSView within a CSSRenderer.
 *
 * Each CSSView actually has its own three-stdlib CSS3DRenderer.
 */
class CSSView extends View {
  /**
   * The id for the view
   */
  id: string;

  /**
   * The camera for the view
   */
  camera: Camera;

  /**
   * The scene for the view
   */
  scene: Scene;

  /**
   * The zIndex for the view
   */
  zIndex = 0;

  /**
   * The current size of the viewport in pixels
   */
  viewportSize: ViewSize;

  /**
   * The current size of the scissor in pixels
   */
  scissorSize: ViewSize;

  /**
   * Parameters for the viewport that are used to recalculate the viewport on resize
   */
  private _viewportParams: ViewRectangleParams;

  /**
   * Getter for the viewport params
   */
  get viewport(): ViewRectangleParams {
    return this._viewportParams;
  }

  /**
   * Setter for the viewport params. Resizes the view on setting.
   */
  set viewport(v: ViewRectangleParams) {
    this._viewportParams = v;
    this._onResize();
  }

  /**
   * Parameters for the scissor that are used to recalculate the scissor on resize
   */
  private _scissorParams: ViewRectangleParams;

  /**
   * Getter for the scissor params
   */
  get scissor(): ViewRectangleParams {
    return this._scissorParams;
  }

  /**
   * Setter for the scissor params. Resizes the view on setting.
   */
  set scissor(v: ViewRectangleParams) {
    this._scissorParams = v;
    this._onResize();
  }

  /**
   * The viewport for the css view rectangle
   */
  _viewport: ViewRectangle;

  /**
   * The scissor for the css view rectangle
   */
  _scissor: ViewRectangle;

  /**
   * Gets the dom element used by the renderer
   */
  get rendererDomElement(): HTMLElement {
    return this.renderer.domElement;
  }

  /**
   * The dom element for the view
   */
  domElement: HTMLElement;

  /**
   * The dom element for the css view viewport
   */
  private viewportElement: HTMLElement;

  /**
   * The dom element for the css view scissor
   */
  private scissorElement: HTMLElement;

  /**
   * The css renderer for the view
   */
  css3DRenderer: CSS3DRenderer;

  /**
   * The resize observer for the renderer dom element
   */
  private resizeObserver: ResizeObserver;

  /**
   * The renderer the view is part of
   */
  private renderer: CSSRenderer;

  constructor(renderer: CSSRenderer, params: CSSViewParams) {
    super();

    this.id = uuid();
    this.renderer = renderer;
    this.scene = params.scene;
    this.camera = params.camera;
    this.css3DRenderer = new CSS3DRenderer();

    // set initial values for computed viewport and scissor properties
    this._viewport = { bottom: 0, left: 0, width: 0, height: 0 };
    this._scissor = { bottom: 0, left: 0, width: 0, height: 0 };
    this.viewportSize = { left: 0, bottom: 0, width: 0, height: 0 };
    this.scissorSize = { left: 0, bottom: 0, width: 0, height: 0 };

    // set viewport and scissor params
    this._viewportParams = params.viewport || {
      bottom: 0,
      left: 0,
      width: 1,
      height: 1,
    };
    this._scissorParams = params.scissor || {
      bottom: 0,
      left: 0,
      width: 1,
      height: 1,
    };

    // create viewport and scissor css elements
    this.domElement = this.css3DRenderer.domElement;
    this.viewportElement = this.domElement;
    this.viewportElement.style.position = 'absolute';

    this.scissorElement = document.createElement('div');
    this.scissorElement.style.position = 'absolute';
    this.scissorElement.style.overflow = 'hidden';
    this.scissorElement.className = `css-view-scissor ${this.id}`;

    this.domElement.id = this.id;
    this.domElement.className = `view css-view ${this.id}`;
    this.domElement.style.zIndex = `${this.zIndex}`;
    this.scissorElement.appendChild(this.domElement);
    this.rendererDomElement.appendChild(this.scissorElement);

    // Create the event listener for the renderer dom element resizing
    window.addEventListener('resize', () => this._onResize(), false);
    this.resizeObserver = new ResizeObserver(() => this._onResize());
    this.resizeObserver.observe(this.renderer.domElement);
  }

  /**
   * Initialises the view
   */
  _init = (): void => {
    this._onResize();
  };

  /**
   * Destroys the view
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _destroy = (): void => {};

  /**
   * Handles resizing
   */
  _onResize = (): void => {
    // get the new viewport and scissor view rectangles
    this._viewport = this.calculateViewRectangle(this._viewportParams);
    this._scissor = this.calculateViewRectangle(this._scissorParams);

    // store the new size of the view
    const rendererDomRect = this.rendererDomElement.getBoundingClientRect();
    this.viewportSize = {
      left: rendererDomRect.width * this._viewport.left,
      bottom: rendererDomRect.height * this._viewport.bottom,
      width: rendererDomRect.width * this._viewport.width,
      height: rendererDomRect.height * this._viewport.height,
    };

    // update the scissor dom element
    this.scissorSize = {
      bottom: this._scissor.bottom * rendererDomRect.height,
      left: this._scissor.left * rendererDomRect.width,
      width: this._scissor.width * rendererDomRect.width,
      height: this._scissor.height * rendererDomRect.height,
    };
    this.scissorElement.style.bottom = `${this.scissorSize.bottom}px`;
    this.scissorElement.style.left = `${this.scissorSize.left}px`;
    this.scissorElement.style.width = `${this.scissorSize.width}px`;
    this.scissorElement.style.height = `${this.scissorSize.height}px`;

    // set the size of the css renderer for the view
    this.css3DRenderer.setSize(
      this.viewportSize.width,
      this.viewportSize.height
    );

    // update the position of the viewport dom element
    this.viewportElement.style.bottom = `${
      this.viewportSize.bottom - this.scissorSize.bottom
    }px`;
    this.viewportElement.style.left = `${
      this.viewportSize.left - this.scissorSize.left
    }px`;

    // update the camera
    this.camera.threeCamera.updateProjectionMatrix();
  };
}

export { CSSView, CSSViewParams };