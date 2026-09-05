"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          textAlign: "center",
          backgroundColor: "#F8FAFC",
          color: "#171717",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            fontWeight: 600,
            color: "#012F42",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            maxWidth: 420,
            marginTop: 16,
            fontSize: 16,
            lineHeight: "24px",
            color: "#5B6472",
          }}
        >
          An unexpected error occurred while loading this page. Please reload to
          continue.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 32,
            padding: "12px 24px",
            border: "none",
            borderRadius: 8,
            backgroundColor: "#FE8F02",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
