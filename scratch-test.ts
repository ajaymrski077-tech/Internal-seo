async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/clients/1/workspace?range=30d", {
      headers: {
        "Cookie": "token=admin-session-token"
      }
    });
    console.log("HTTP GET Status:", res.status);
    const bodyText = await res.text();
    console.log("HTTP Response Body:", bodyText.slice(0, 300) + "...");
  } catch (err: any) {
    console.error("HTTP Fetch failed:", err);
  }
}

main();
