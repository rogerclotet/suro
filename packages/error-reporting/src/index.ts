import type { ErrorEvent, StackFrame } from "@sentry/core";

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

function errorSummary(message: string | undefined): string {
  const convex = convexFailure(message);
  if (!convex) return "Error details omitted for privacy";
  return convex.function
    ? `Convex ${convex.function.type}(${convex.function.name}) failed`
    : "Convex request failed";
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

/** An allowlist prevents new SDK integrations from silently adding personal data. */
export function anonymousError(event: ErrorEvent): ErrorEvent {
  const action = event.tags?.action;
  const tags: Record<string, string> = {};
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
    release: event.release,
    dist: event.dist,
    environment: event.environment,
    // Explicitly avoid ingestion-side IP inference. No account or device identifier.
    user: { ip_address: "0.0.0.0" },
    tags: Object.keys(tags).length ? tags : undefined,
    exception: event.exception && {
      values: event.exception.values?.map((exception) => ({
        type: exception.type,
        // Error messages can contain form values, tokens or server arguments.
        value: errorSummary(exception.value),
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
