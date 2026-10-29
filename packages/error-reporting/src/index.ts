import type { ErrorEvent, RequestEventData, StackFrame } from "@sentry/core";

function convexFailure(message: string | undefined) {
  // Only accept the SDK's prefix, never arbitrary text inside an error payload.
  const match = message?.match(
    /^(?:\[CONVEX ([QMA])\(([\w./-]+:[\w$]+)\)\]\s*)?\[Request ID: ([a-f0-9]{16,64})\](?:\s|$)/i,
  );
  const requestId = match?.[3];
  if (!requestId) return null;
  const functionType = match[1];
  const functionName = match[2];
  return {
    requestId,
    function:
      functionName && functionType
        ? { name: functionName, type: functionType }
        : null,
  };
}

function sourcePath(path: string | undefined): string | undefined {
  return path
    ?.split(/[?#]/, 1)[0]
    ?.replace(/\/Users\/[^/]+\//g, "/Users/anonymous/")
    .replace(/\/home\/[^/]+\//g, "/home/anonymous/");
}

function frameWithoutData(frame: StackFrame): StackFrame {
  return {
    filename: sourcePath(frame.filename),
    abs_path: sourcePath(frame.abs_path),
    function: frame.function,
    module: frame.module,
    lineno: frame.lineno,
    colno: frame.colno,
    in_app: frame.in_app,
  };
}

const httpMethods = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);

function header(
  headers: RequestEventData["headers"],
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const key = Object.keys(headers).find((key) => key.toLowerCase() === name);
  return key === undefined ? undefined : headers[key];
}

/**
 * Describes the request behind a Next.js server request error (the only events
 * with a `nextjs` context) without its URL, query, headers or body. The route
 * is the file-system pattern (`/[locale]/lists`), never the concrete path, and
 * the content type loses its parameters.
 */
function requestTags(event: ErrorEvent): Record<string, string> {
  const tags: Record<string, string> = {};
  const nextjs = event.contexts?.nextjs;
  if (!nextjs) return tags;
  const routeType = nextjs.route_type;
  if (typeof routeType === "string" && /^[a-z]+$/.test(routeType))
    tags.route_type = routeType;
  const routerPath = nextjs.router_path;
  if (
    typeof routerPath === "string" &&
    routerPath.length <= 200 &&
    /^\/[\w\-./[\]()@]*$/.test(routerPath)
  )
    tags.router_path = routerPath;

  // The SDK's raw request snapshot; `event.request` only carries headers when
  // header collection is on.
  const request: RequestEventData | undefined =
    event.sdkProcessingMetadata?.normalizedRequest ?? event.request;
  if (!request) return tags;
  const method = request.method?.toUpperCase();
  if (method && httpMethods.has(method)) tags.http_method = method;
  const mediaType = header(request.headers, "content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (mediaType && /^[a-z]+\/[\w.+-]+$/.test(mediaType))
    tags.content_type = mediaType;
  if (request.headers)
    tags.has_next_action = String(
      header(request.headers, "next-action") !== undefined,
    );
  return tags;
}

/** Keep diagnostic messages while allowlisting the surrounding event metadata. */
export function anonymousError(event: ErrorEvent): ErrorEvent {
  const action = event.tags?.action;
  const tags = requestTags(event);
  if (typeof action === "string" && /^[a-z_]+$/.test(action))
    tags.action = action;
  const convex = event.exception?.values
    ?.map((exception) => convexFailure(exception.value))
    .find((failure) => failure !== null);
  if (convex) {
    tags.convex_request_id = convex.requestId;
    if (convex.function) {
      tags.convex_function = convex.function.name;
      tags.convex_function_type = convex.function.type;
    }
  }
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    message: event.message,
    release: event.release,
    dist: event.dist,
    environment: event.environment,
    // Explicitly avoid ingestion-side IP inference. No account or device identifier.
    user: { ip_address: "0.0.0.0" },
    tags: Object.keys(tags).length ? tags : undefined,
    exception: event.exception && {
      values: event.exception.values?.map((exception) => ({
        type: exception.type,
        value: exception.value,
        stacktrace: exception.stacktrace && {
          frames: exception.stacktrace.frames?.map(frameWithoutData),
        },
        mechanism: exception.mechanism && {
          type: exception.mechanism.type,
          handled: exception.mechanism.handled,
        },
      })),
    },
    debug_meta: event.debug_meta && {
      images: event.debug_meta.images
        ?.filter((image) => image.type === "sourcemap")
        .map((image) => ({
          type: image.type,
          code_file: sourcePath(image.code_file) ?? "",
          debug_id: image.debug_id,
        })),
    },
  };
}
