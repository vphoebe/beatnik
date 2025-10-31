/*
 * This file includes code from <WD-40> (https://github.com/iTsMaaT/WD-40)
 * Copyright (c) 2025 iTsMaaT
 * Licensed under the MIT License (see LICENSE for details)
 */
import type { Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import { ImageData as CanvasImageData, createCanvas } from "@napi-rs/canvas";
import type { WebPoSignalOutput } from "bgutils-js";
import { BG, GOOG_API_KEY, USER_AGENT, buildURL } from "bgutils-js";
import type { DOMWindow } from "jsdom";
import { JSDOM } from "jsdom";
import type Innertube from "youtubei.js";

declare global {
  interface HTMLCanvasElement {
    _napiCanvasState: { canvas: Canvas | null; context: CanvasRenderingContext2D | null };
  }
}

const REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";

let domWindow: DOMWindow;
let initializationPromise: Promise<BG.WebPoMinter> | null = null;
let botguardClient: BG.BotGuardClient | undefined;
let webPoMinter: BG.WebPoMinter | undefined;
let activeScriptId: string | null = null;
let canvasPatched = false;

function patchCanvasSupport(window: DOMWindow) {
  if (canvasPatched) return;

  const HTMLCanvasElement = window?.HTMLCanvasElement;
  if (!HTMLCanvasElement) return;

  Object.defineProperty(HTMLCanvasElement.prototype, "_napiCanvasState", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: null,
  });
  // @ts-expect-error Extending DOM types is too much paperwork
  HTMLCanvasElement.prototype.getContext = function getContext(type, options) {
    if (type !== "2d") return null;

    const width = Number.isFinite(this.width) && this.width > 0 ? this.width : 300;
    const height = Number.isFinite(this.height) && this.height > 0 ? this.height : 150;

    const state = this._napiCanvasState || {};

    if (!state.canvas) {
      state.canvas = createCanvas(width, height);
    } else if (state.canvas.width !== width || state.canvas.height !== height) {
      state.canvas.width = width;
      state.canvas.height = height;
    }

    state.context = state.canvas.getContext("2d", options);
    this._napiCanvasState = state;
    return state.context;
  };

  HTMLCanvasElement.prototype.toDataURL = function toDataURL(...args) {
    if (!this._napiCanvasState?.canvas) {
      const width = Number.isFinite(this.width) && this.width > 0 ? this.width : 300;
      const height = Number.isFinite(this.height) && this.height > 0 ? this.height : 150;
      this._napiCanvasState = {
        canvas: createCanvas(width, height),
        context: null,
      };
    }
    // @ts-expect-error Extending DOM types is too much paperwork
    return this._napiCanvasState.canvas?.toDataURL(...args) as string;
  };

  if (!window.ImageData) window.ImageData = CanvasImageData;

  if (!Reflect.has(globalThis, "ImageData")) {
    Object.defineProperty(globalThis, "ImageData", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: CanvasImageData,
    });
  }

  canvasPatched = true;
}

function ensureDomEnvironment(userAgent: string) {
  if (domWindow) return domWindow;

  const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
    url: "https://www.youtube.com/",
    referrer: "https://www.youtube.com/",
    userAgent,
  });

  domWindow = dom.window;

  const globalAssignments = {
    window: domWindow,
    document: domWindow.document,
    location: domWindow.location,
    origin: domWindow.origin,
    navigator: domWindow.navigator,
    HTMLElement: domWindow.HTMLElement,
    atob: domWindow.atob,
    btoa: domWindow.btoa,
    crypto: domWindow.crypto,
    performance: domWindow.performance,
  };

  for (const [key, value] of Object.entries(globalAssignments)) {
    if (!Reflect.has(globalThis, key)) {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value,
      });
    }
  }

  if (!Reflect.has(globalThis, "self")) {
    Object.defineProperty(globalThis, "self", {
      configurable: true,
      enumerable: false,
      writable: true,
      value: globalThis,
    });
  }

  patchCanvasSupport(domWindow);

  return domWindow;
}

function resetBotguardState() {
  if (botguardClient?.shutdown) {
    try {
      botguardClient.shutdown();
    } catch {
      /* no-op */
    }
  }

  if (activeScriptId && domWindow?.document)
    domWindow.document.getElementById(activeScriptId)?.remove();

  botguardClient = undefined;
  webPoMinter = undefined;
  activeScriptId = null;
  initializationPromise = null;
}

async function initializeBotguard(
  innertube: Innertube,
  { forceRefresh }: { forceRefresh?: boolean } = {},
) {
  if (forceRefresh) resetBotguardState();

  if (webPoMinter) return webPoMinter;

  if (initializationPromise) return await initializationPromise;

  const userAgent = innertube.session.context.client.userAgent || USER_AGENT;
  ensureDomEnvironment(userAgent);

  initializationPromise = (async () => {
    const challengeResponse = await innertube.getAttestationChallenge("ENGAGEMENT_TYPE_UNBOUND");
    const challenge = challengeResponse?.bg_challenge;

    if (!challenge) throw new Error("Failed to retrieve Botguard challenge.");

    const interpreterUrl =
      challenge.interpreter_url?.private_do_not_access_or_else_trusted_resource_url_wrapped_value;

    if (!interpreterUrl) throw new Error("Botguard challenge did not provide an interpreter URL.");

    if (!domWindow.document.getElementById(interpreterUrl)) {
      const interpreterResponse = await fetch(`https:${interpreterUrl}`, {
        headers: {
          "user-agent": userAgent,
        },
      });

      const interpreterJavascript = await interpreterResponse.text();

      if (!interpreterJavascript)
        throw new Error("Failed to download Botguard interpreter script.");

      const script = domWindow.document.createElement("script");
      script.type = "text/javascript";
      script.id = interpreterUrl;
      script.textContent = interpreterJavascript;
      domWindow.document.head.appendChild(script);
      activeScriptId = script.id;

      const executeInterpreter = new domWindow.Function(interpreterJavascript);
      executeInterpreter.call(domWindow);
    }

    botguardClient = await BG.BotGuardClient.create({
      program: challenge.program,
      globalName: challenge.global_name,
      globalObj: globalThis,
    });

    const webPoSignalOutput: WebPoSignalOutput = [];
    const botguardSnapshot = await botguardClient.snapshot({ webPoSignalOutput });

    const integrityResponse = await fetch(buildURL("GenerateIT", true), {
      method: "POST",
      headers: {
        "content-type": "application/json+protobuf",
        "x-goog-api-key": GOOG_API_KEY,
        "x-user-agent": "grpc-web-javascript/0.1",
        "user-agent": userAgent,
      },
      body: JSON.stringify([REQUEST_KEY, botguardSnapshot]),
    });

    const integrityPayload = await integrityResponse.json();
    const integrityToken = integrityPayload?.[0];

    if (typeof integrityToken !== "string")
      throw new Error("Botguard integrity token generation failed.");

    webPoMinter = await BG.WebPoMinter.create({ integrityToken }, webPoSignalOutput);

    return webPoMinter;
  })()
    .catch((error) => {
      resetBotguardState();
      throw error;
    })
    .finally(() => {
      initializationPromise = null;
    });

  return await initializationPromise;
}

function requireBinding(binding?: string) {
  if (!binding) throw new Error("Content binding is required to mint a WebPO token.");
  return binding;
}

export async function getWebPoMinter(innertube: Innertube, options = {}) {
  const minter = await initializeBotguard(innertube, options);

  return {
    generatePlaceholder(binding: string) {
      return BG.PoToken.generateColdStartToken(requireBinding(binding));
    },
    async mint(binding: string) {
      return await minter.mintAsWebsafeString(requireBinding(binding));
    },
  };
}

export function invalidateWebPoMinter() {
  resetBotguardState();
}
