import posthog from "posthog-js";

// Check if API key exists before initializing
if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  console.error(
    "❌ PostHog API key is missing! Add NEXT_PUBLIC_POSTHOG_KEY to your environment variables."
  );
} else {
  try {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2025-05-24",
      capture_exceptions: true, // Enables capturing exceptions via Error Tracking
      debug: process.env.NODE_ENV === "development",
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
    });

    // Debug logging for both development and production
    console.log("✅ PostHog initialized successfully");
    console.log("🔍 Session recording should be enabled by default");

    // Add a test event to verify PostHog is working
    posthog.capture("posthog_initialized", {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ PostHog initialization failed:", error);
  }
}
